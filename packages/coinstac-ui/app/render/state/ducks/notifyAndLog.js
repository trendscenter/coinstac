'use strict';

import {
  error, info, success, warning,
} from 'react-notification-system-redux';
import { ipcRenderer } from 'electron';

const defaultNotification = { autoDismiss: 2, position: 'bl' };

// Action Creators
export const writeLog = (message => () => ipcRenderer.send('write-log', message)
);

export const notifyError = message => dispatch => dispatch(
  error({ ...defaultNotification, ...message })
);

export const notifyInfo = message => dispatch => dispatch(
  info({ ...defaultNotification, ...message })
);

export const notifySuccess = message => dispatch => dispatch(
  success({ ...defaultNotification, ...message })
);

export const notifyWarning = message => dispatch => dispatch(
  warning({ ...defaultNotification, ...message })
);
