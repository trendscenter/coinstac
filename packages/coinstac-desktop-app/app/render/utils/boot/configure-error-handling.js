/**
 * Configure render-process error handling.
 */

import { ipcRenderer } from 'electron';

function onError(error) {
  ipcRenderer.send('write-log', {
    type: 'error',
    message: `Unhandled error: ${typeof error === 'object' ? JSON.stringify(error) : error}`,
  });
}

function onUnhandledRejection(event) {
  ipcRenderer.send('write-log', {
    type: 'error',
    message: `Unhandled rejection - Message: ${event.reason.message} - Stack: ${event.reason.stack}`,
  });
}

export function start() {
  window.addEventListener('error', onError);

  /**
   * Respond to unhandled rejections. Coming to Electron soon-ish.
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent}
   * {@link http://stackoverflow.com/a/32940253}
   */
  window.addEventListener('unhandledrejection', onUnhandledRejection);
}

export function stop() {
  window.removeEventListener('error', onError);
  window.removeEventListener('unhandledrejection', onUnhandledRejection);
}
