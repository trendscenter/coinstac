import { useEffect } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';

import { notifyError, notifySuccess } from '../../../state/ducks/notifyAndLog';
import { saveLocalRun, updateLocalRun } from '../../../state/ducks/runs';

function LocalRunStatusListeners({
  updateLocalRun, saveLocalRun, notifySuccess, notifyError,
}) {
  useEffect(() => {
    ipcRenderer.on('local-pipeline-state-update', (event, arg) => {
      updateLocalRun(
        arg.run.id,
        { localPipelineState: arg.data }
      );
    });

    ipcRenderer.on('save-local-run', (event, arg) => {
      saveLocalRun({
        ...arg.run,
        status: 'started',
      });
    });

    ipcRenderer.on('local-run-complete', (event, arg) => {
      notifySuccess(`${arg.consName} Pipeline Complete.`);

      updateLocalRun(arg.run.id, { results: arg.run.results, status: 'complete', type: arg.run.type });
    });

    ipcRenderer.on('local-run-error', (event, arg) => {
      notifyError(`${arg.consName} Pipeline Error.`);

      updateLocalRun(arg.run.id, { error: arg.run.error, status: 'error', type: arg.run.type });
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
  updateLocalRun: PropTypes.func.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
};

export default connect(null,
  {
    notifyError,
    notifySuccess,
    saveLocalRun,
    updateLocalRun,
  })(LocalRunStatusListeners);
