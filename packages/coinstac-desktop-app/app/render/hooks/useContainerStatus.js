import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';

function useContainerStatus() {
  const [containerStatus, setContainerStatus] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await ipcRenderer.invoke('get-status');
        setContainerStatus(status === 'OK');
      } catch (_) {
        setContainerStatus(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return containerStatus;
}

export default useContainerStatus;
