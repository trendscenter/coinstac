import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ipcRenderer } from 'electron';
import { appendLogMessage } from '../../../state/ducks/app';

function LogListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    ipcRenderer.on('log-message', (_, arg) => {
      dispatch(appendLogMessage(arg.data));
    });

    return () => {
      ipcRenderer.removeAllListeners('log-message');
    };
  }, []);

  return null;
}

export default LogListener;
