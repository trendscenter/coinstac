/* eslint-disable no-case-declarations */
import { ipcRenderer } from 'electron';
import {
  ERROR,
  WARNING,
  INFO,
  SUCCESS,
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

export const dequeueNotification = () => ({
  type: DEQUEUE_NOTIFICATION,
});

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ENQUEUE_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { message: action.message, severity: action.severity },
        ],
      };
    case DEQUEUE_NOTIFICATION:
      const notifications = [...state.notifications];
      notifications.shift();

      return {
        ...state,
        notifications,
      };
    default:
      return state;
  }
}
