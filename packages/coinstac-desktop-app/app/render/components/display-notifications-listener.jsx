import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Notification from './notification';

import { dequeueNotification } from '../state/ducks/notifyAndLog';

function DisplayNotificationsListener() {
  const notifications = useSelector(state => state.notifications.notifications);
  const dispatch = useDispatch();

  if (!notifications) return null;

  function onCloseNotification(notificationId) {
    dispatch(dequeueNotification(notificationId));
  }

  return (
    <>
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id}
          duration={5000}
          id={notification.id}
          message={notification.message}
          severity={notification.severity}
          index={index}
          onClose={onCloseNotification}
        />
      ))}
    </>
  );
}

export default DisplayNotificationsListener;
