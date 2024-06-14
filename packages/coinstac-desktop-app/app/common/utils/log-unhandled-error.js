/* eslint-disable no-console */
const mkdirpSync = require('mkdirp').sync;
const fs = require('fs');
const path = require('path');
const os = require('os');

const unfinishedBootLog = {
  error(content) { console.error(content); },
};
const logLocations = {
  darwin: 'Library/Logs/coinstac/',
  freebsd: '.config/coinstac/',
  linux: '.config/coinstac/',
  sunos: '.config/coinstac/',
  win32: 'coinstac/',
};

const getCurrentDate = () => new Date().toISOString();

const getLogMessage = ({ message, level }) => `${getCurrentDate()} { message: ${message}, level: ${level} }`;

/**
 * returns a function to use for pre-boot error logging based on file
 * permissions, falls back to console otherwise
 * @return {function} appropriate logging function for permissions
 */
const unhandledBootLogger = () => {
  const logLocation = path.join(
    process.env.HOME || process.env.TEMP,
    logLocations[process.platform],
  );
  const logFilePath = path.join(logLocation, 'coinstac-boot-error-log.txt');
  const consoleLogger = data => console.error(getLogMessage({ message: data, level: 'error' }));

  if (process.env.NODE_ENV === 'development') {
    console.error(
      getLogMessage({ message: 'boot error logging to file disabled', level: 'warning' }),
    );
    return consoleLogger;
  }

  try {
    mkdirpSync(logLocation, 0o0775);

    const fileLogger = (data) => {
      if (process.env.NODE_ENV === 'development') {
        return console.error(getLogMessage({ message: data, level: 'error' }));
      }
      return fs.appendFileSync(logFilePath, getLogMessage({ message: `${data}${os.EOL}`, level: 'error' }));
    };
    return fileLogger;
  } catch (err) {
    // can't open file for writes, try to log to console
    console.error(
      getLogMessage({ message: 'boot error logging to file disabled', level: 'error' }),
    );

    getLogMessage({ message: err, level: 'error' });
    getLogMessage({ message: err.stack, level: 'error' });

    const consoleLogger = data => console.error(getLogMessage({ message: data, level: 'error' }));
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
