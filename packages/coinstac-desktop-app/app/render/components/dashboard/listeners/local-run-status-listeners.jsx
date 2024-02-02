import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ipcRenderer } from 'electron';

import { notifyError, notifySuccess, notifyInfo } from '../../../state/ducks/notifyAndLog';
import { saveRunLocally, updateRunLocally } from '../../../state/ducks/runs';

function LocalRunStatusListeners() {
  const dispatch = useDispatch();

  useEffect(() => {
    ipcRenderer.on('local-pipeline-state-update', (_, arg) => {
      dispatch(updateRunLocally(
        arg.run.id,
        { localPipelineState: arg.data }
      ));
    });

    ipcRenderer.on('save-local-run', (_, arg) => {
      localStorage.setItem('coinstac-debug', JSON.stringify({ lastRun: { steps: arg.steps, sim: arg.steps[0].inputMap } }));
      dispatch(saveRunLocally({
        ...arg.run,
        status: 'started',
      }, true));
    });

    ipcRenderer.on('local-run-complete', (_, arg) => {
      dispatch(notifySuccess(`${arg.consName} Pipeline Complete.`));

      dispatch(updateRunLocally(arg.run.id, { results: arg.run.results, status: 'complete', type: arg.run.type }));
    });

    ipcRenderer.on('local-run-error', (_, arg) => {
      if (arg.run && arg.run.error && arg.run.error.message === 'Pipeline operation suspended by user') {
        dispatch(notifyInfo(`${arg.consName} Pipeline suspended.`));
        dispatch(updateRunLocally(arg.run.id, { status: 'suspended', type: arg.run.type }));
        return;
      }

      dispatch(notifyError(`${arg.consName} Pipeline Error.`));
      dispatch(updateRunLocally(arg.run.id, { error: arg.run.error, status: 'error', type: arg.run.type }));
    });

    return () => {
      ipcRenderer.removeAllListeners('local-pipeline-state-update');
      ipcRenderer.removeAllListeners('save-local-run');
      ipcRenderer.removeAllListeners('local-run-complete');
      ipcRenderer.removeAllListeners('local-run-error');
    };
  }, []);

  return null;
}

export default LocalRunStatusListeners;
