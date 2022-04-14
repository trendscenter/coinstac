import { useEffect } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';

import { notifyError, notifySuccess, notifyInfo } from '../../../state/ducks/notifyAndLog';
import { saveRunLocally, updateRunLocally } from '../../../state/ducks/runs';

function LocalRunStatusListeners({
  updateRunLocally, saveRunLocally, notifySuccess, notifyError,
}) {
  useEffect(() => {
    ipcRenderer.on('local-pipeline-state-update', (event, arg) => {
      updateRunLocally(
        arg.run.id,
        { localPipelineState: arg.data }
      );
    });

    ipcRenderer.on('save-local-run', (event, arg) => {
      saveRunLocally({
        ...arg.run,
        status: 'started',
      }, true);
    });

    ipcRenderer.on('local-run-complete', (event, arg) => {
      notifySuccess(`${arg.consName} Pipeline Complete.`);

      updateRunLocally(arg.run.id, { results: arg.run.results, status: 'complete', type: arg.run.type });
    });

    ipcRenderer.on('local-run-error', (event, arg) => {
      if (arg.run && arg.run.error && arg.run.error.message === 'Pipeline operation suspended by user') {
        notifyInfo(`${arg.consName} Pipeline suspended.`);
        updateRunLocally(arg.run.id, { status: 'suspended', type: arg.run.type });
        return;
      }

      notifyError(`${arg.consName} Pipeline Error.`);
      updateRunLocally(arg.run.id, { error: arg.run.error, status: 'error', type: arg.run.type });
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

LocalRunStatusListeners.propTypes = {
  updateRunLocally: PropTypes.func.isRequired,
  saveRunLocally: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
};

export default connect(null,
  {
    notifyInfo,
    notifyError,
    notifySuccess,
    saveRunLocally,
    updateRunLocally,
  })(LocalRunStatusListeners);
