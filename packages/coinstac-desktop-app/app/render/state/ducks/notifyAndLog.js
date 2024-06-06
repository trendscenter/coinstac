/* eslint-disable no-case-declarations */
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';

import {
  ERROR,
  INFO,
  SUCCESS,
  WARNING,
} from '../../utils/notification-severity-codes';

const INITIAL_STATE = {
  notifications: [],
};

// Actions
const ENQUEUE_NOTIFICATION = 'ENQUEUE_NOTIFICATION';
const DEQUEUE_NOTIFICATION = 'DEQUEUE_NOTIFICATION';

// Action Creators
export const writeLog = (message => () => ipcRenderer.send('write-log', message)
);

export const notifyError = message => ({
  type: ENQUEUE_NOTIFICATION,
  severity: ERROR,
  message,
});

export const notifyWarning = message => ({
  type: ENQUEUE_NOTIFICATION,
  severity: WARNING,
  message,
});

export const notifyInfo = message => ({
  type: ENQUEUE_NOTIFICATION,
  severity: INFO,
  message,
});

export const notifySuccess = message => ({
  type: ENQUEUE_NOTIFICATION,
  severity: SUCCESS,
  message,
});

export const dequeueNotification = id => ({
  type: DEQUEUE_NOTIFICATION,
  notificationId: id,
});

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ENQUEUE_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: uuidv4(),
            message: action.message,
            severity: action.severity,
          },
        ],
      };
    case DEQUEUE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.notificationId,
        ),
      };
    default:
      return state;
  }
}
