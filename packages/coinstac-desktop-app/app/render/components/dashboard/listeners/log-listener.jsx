import { useEffect } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { appendLogMessage } from '../../../state/ducks/app';

function LogListener({ appendLogMessage }) {
  useEffect(() => {
    ipcRenderer.on('log-message', (event, arg) => {
      appendLogMessage(arg.data);
    });

    return () => {
      ipcRenderer.removeAllListeners('log-message');
    };
  }, []);

  return null;
}

export default connect(null, {
  appendLogMessage,
})(LogListener);
