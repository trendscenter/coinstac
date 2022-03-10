import { useEffect } from 'react';
import { ipcRenderer } from 'electron';

function AutoUpdateListener() {
  useEffect(() => {
    ipcRenderer.on('auto-update-log', (event, message) => {
      console.log(message);
    });

    return () => {
      ipcRenderer.removeAllListeners('auto-update-log');
    };
  }, []);

  return null;
}

export default AutoUpdateListener;
