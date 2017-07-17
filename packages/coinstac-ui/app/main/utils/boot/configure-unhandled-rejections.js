'use strict';

const app = require('ampersand-app');

/**
 * **Handle** unhandled rejections.
 *
 * @todo This prevents program shutdown on unhandled rejections, which equate to
 * unknown program state. Drop this and use
 * app/common/utils/log-unhandled-error.js once
 * {@link https://github.com/electron/electron/issues/6113} is closed.
 *
 * {@link https://nodejs.org/api/process.html#process_event_unhandledrejection}
 */

process.on('unhandledRejection', (reason, p) => {
  app.mainLogger.error('Unhandled rejection at: Promise ', p, ' reason: ', reason);
  app.mainWindow.webContents.send('async-error', reason.message);
});
