import app from 'ampersand-app';
import electron from 'electron';

const mainLogger = electron.remote.require('app/main/utils/expose-app.js')().mainLogger;
const renderLogger = electron.remote.require('app/main/utils/expose-app.js')().renderLogger;

/**
 * Get configured logger.
 *
 * @param {string} consoleMethod Name of `console` method
 * @param {string} winstonMethod Name of Winston's logger method (selected from
 * defaults)
 * @returns {Function} logger
 */
function getLogger(consoleMethod, winstonMethod, logger) {
  return (...args) => {
    console[consoleMethod].apply(console, args); // eslint-disable-line no-console
    logger[winstonMethod].apply(null, ['ui', ...args]);
  };
}

module.exports = function configureLogger() {
  app.mainLogger = {
    debug: getLogger('log', 'debug', mainLogger),
    error: getLogger('error', 'error', mainLogger),
    info: getLogger('log', 'info', mainLogger),
    log: getLogger('log', 'info', mainLogger),
    verbose: getLogger('log', 'verbose', mainLogger),
    warn: getLogger('warn', 'warn', mainLogger),
  };

  app.renderLogger = {
    debug: getLogger('log', 'debug', renderLogger),
    error: getLogger('error', 'error', renderLogger),
    info: getLogger('log', 'info', renderLogger),
    log: getLogger('log', 'info', renderLogger),
    verbose: getLogger('log', 'verbose', renderLogger),
    warn: getLogger('warn', 'warn', renderLogger),
  };
};
