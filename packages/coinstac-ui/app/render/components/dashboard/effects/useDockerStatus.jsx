import { useState, useEffect } from 'react';
import ipcPromise from 'ipc-promise';

function useDockerStatus() {
  const [dockerStatus, setDockerStatus] = useState(true);

  useEffect(() => {
    const dockerInterval = setInterval(async () => {
      try {
        const status = await ipcPromise.send('get-status');

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
