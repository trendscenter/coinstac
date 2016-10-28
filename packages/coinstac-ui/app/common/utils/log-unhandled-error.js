const { get } = require('lodash');
const app = require('ampersand-app');
const mkdirpSync = require('mkdirp').sync;
const fs = require('fs');
const path = require('path');
const os = require('os');

const unfinishedBootLog = {
  error(content) { console.error(content); }, // eslint-disable-line no-console
};
const logLocations = {
  darwin: 'Library/Logs/coinstac/',
  freebsd: '.config/coinstac/',
  linux: '.config/coinstac/',
  sunos: '.config/coinstac/',
  win32: 'AppData/Roaming/coinstac/',
};

/**
 * returns a function to use for pre-boot error logging based on file
 * permissions, falls back to console otherwise
 * @return {function} appropriate logging function for permissions
 */
const unhandledBootLogger = () => {
  const logLocation = path.join(
    process.env.HOME || process.env.TEMP,
    logLocations[process.platform]
   );
  const logFilePath = path.join(logLocation, 'coinstac-boot-error-log.txt');
  const consoleLogger = (data) => {
    return console.error(`${new Date()} ERROR: ${data}`); // eslint-disable-line no-console
  };

  if (process.env === 'development') {
    console.error(  // eslint-disable-line no-console
      `${new Date()} WARNING: boot error logging to file disabled`
    );
    return consoleLogger;
  }

  try {
    mkdirpSync(logLocation, parseInt('0775', 8));

    const fileLogger = (data) => {
      if (process.ENV === 'development') {
        return console.error(`${new Date()} ERROR: ${data}`); // eslint-disable-line no-console
      }
      return fs.appendFileSync(logFilePath, `${new Date()} ERROR: ${data}${os.EOL}`);
    };
    return fileLogger;
  } catch (err) {
    // can't open file for writes, try to log to console
    console.error(  // eslint-disable-line no-console
      `${new Date()} WARNING: boot error logging to file disabled`
    );
    console.error(`ERROR: ${err}`); // eslint-disable-line no-console

    const consoleLogger = (data) => {
      return console.error(`${new Date()} ERROR: ${data}`); // eslint-disable-line no-console
    };
    return consoleLogger;
  }
};

/**
 * log utility used in the event that an error occurred before application could
 * fully boot and use the desired app-level logger.
 * @param {*}
 * @returns {undefined}
 */
module.exports = function logUnhandledError(opts) {
  opts = opts || {};
  const errorLogger = unhandledBootLogger();
  return (err) => {
    const logger = get(app, 'logger') || unfinishedBootLog;
    if (logger === unfinishedBootLog) {
      errorLogger('error occurred before application had finished booting');
      errorLogger(err);
      process.exit(1);
    } else if (opts.processType === 'render') {
      errorLogger(err);
      errorLogger(err.stack);
    } else {
      errorLogger(err);
    }

    throw err;
  };
};
