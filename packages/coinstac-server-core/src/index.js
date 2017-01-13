'use strict';

const CoinstacServer = require('./coinstac-server.js');
const logger = require('./services/logger.js');

/**
 * Error handler for server errors, process `uncaughtException`s and
 * process `unhandledRejection`s.
 *
 * @param {Error} error
 * @param {Promise} [promise]
 */
function errorHandler(error, promise) {
  if (typeof promise === 'undefined') {
    logger.error('Server error', error);
  } else {
    logger.error('Server promise rejection', error, promise);
  }

  process.nextTick(() => process.exit(1));
}

process.on('uncaughtException', errorHandler);

process.on('unhandledRejection', errorHandler);

process.on('exit', () => {
  logger.info('Shutting down server…');
});

let server;

module.exports = {
  /**
   * Get the server instance.
   * @private
   *
   * @returns {(CoinstacServer|undefined)}
   */
  getInstance() {
    return server;
  },

  /**
   * Start the server.
   *
   * @param {Object} [config]
   * @returns {Promise}
   */
  start(config) {
    if (!server) {
      server = new CoinstacServer(typeof config === 'object' ? config : {});
    }

    return server.start();
  },

  /**
   * Stop the server.
   *
   * @returns {Promise}
   */
  stop() {
    if (server) {
      return server.stop().then(() => {
        server = undefined;
      });
    }

    return Promise.resolve();
  },
};
