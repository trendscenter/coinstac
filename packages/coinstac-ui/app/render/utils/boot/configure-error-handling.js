/**
 * Configure render-process error handling.
 */

import app from 'ampersand-app';

function onError(error) {
  app.logger.error('Unhandled error:', error);
}

function onUnhandledRejection(event) {
  app.logger.error('Unhandled rejection:', event.promise, event.reason);
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
