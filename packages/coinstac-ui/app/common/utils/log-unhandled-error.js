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
  win32: 'coinstac/',
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
    console.error( // eslint-disable-line no-console
      `${new Date()} WARNING: boot error logging to file disabled`
    );
    return consoleLogger;
  }

  try {
    mkdirpSync(logLocation, 0o0775);

    const fileLogger = (data) => {
      if (process.ENV === 'development') {
        return console.error(`${new Date()} ERROR: ${data}`); // eslint-disable-line no-console
      }
      return fs.appendFileSync(logFilePath, `${new Date()} ERROR: ${data}${os.EOL}`);
    };
    return fileLogger;
  } catch (err) {
    // can't open file for writes, try to log to console
    console.error( // eslint-disable-line no-console
      `${new Date()} WARNING: boot error logging to file disabled`
    );
    /* eslint-disable no-console */
    console.error(`ERROR: ${err}`);
    console.error(`ERROR: ${err.stack}`);
    /* eslint-enable no-console */

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
module.exports = function logUnhandledError(opts, logr) {
  opts = opts || {};
  const errorLogger = unhandledBootLogger();
  const logger = logr || errorLogger || unfinishedBootLog;
  return (err) => {
    if (logger === unfinishedBootLog) {
      logger('error occurred before application had finished booting');
      logger(err);
      logger(err.stack);
      process.exit(1);
    } else {
      logger.error(err);
      logger.error(err.stack);
    }

    throw err;
  };
};
