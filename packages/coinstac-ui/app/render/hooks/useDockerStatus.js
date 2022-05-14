import { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';

function useDockerStatus() {
  const [dockerStatus, setDockerStatus] = useState(true);

  useEffect(() => {
    const dockerInterval = setInterval(async () => {
      try {
        const status = await ipcRenderer.invoke('get-status');
        setDockerStatus(status === 'OK');
      } catch (_) {
        setDockerStatus(false);
      }
    }, 5000);

    return () => clearInterval(dockerInterval);
  }, []);

  return dockerStatus;
}

export default useDockerStatus;
