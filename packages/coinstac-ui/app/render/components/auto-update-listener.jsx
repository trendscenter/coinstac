import { useEffect } from 'react';
import { ipcRenderer } from 'electron';

function AutoUpdateListener() {
  useEffect(() => {
    return () => {
      ipcRenderer.removeAllListeners('auto-update-log');
    };
  }, []);

  return null;
}

export default AutoUpdateListener;
