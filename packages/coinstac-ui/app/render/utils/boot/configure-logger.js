import app from 'ampersand-app';
import electron from 'electron';

const mainLogger = electron.remote.require('app/main/utils/expose-app.js')().logger;

/**
 * Get configured logger.
 *
 * @param {string} consoleMethod Name of `console` method
 * @param {string} winstonMethod Name of Winston's logger method (selected from
 * defaults)
 * @returns {Function} logger
 */
function getLogger(consoleMethod, winstonMethod) {
  return (...args) => {
    console[consoleMethod](...args); // eslint-disable-line no-console
    mainLogger[winstonMethod].apply(null, ['ui', ...args]);
  };
}

module.exports = function configureLogger() {
  app.logger = {
    debug: getLogger('log', 'debug'),
    error: getLogger('error', 'error'),
    info: getLogger('log', 'info'),
    log: getLogger('log', 'info'),
    verbose: getLogger('log', 'verbose'),
    warn: getLogger('warn', 'warn'),
  };
};
