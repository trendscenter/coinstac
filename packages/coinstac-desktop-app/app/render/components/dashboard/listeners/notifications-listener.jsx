import { ipcRenderer } from 'electron';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { notifyWarning } from '../../../state/ducks/notifyAndLog';

function NotificationsListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    ipcRenderer.on('notify-warning', (_, arg) => {
      dispatch(notifyWarning(arg));
    });
  }, []);

  return null;
}

export default NotificationsListener;
