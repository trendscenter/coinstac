'use strict';

const app = require('ampersand-app');
const path = require('path');
const cliOpts = require('./parse-cli-input.js').get();
const winston = require('winston');
const promisify = require('bluebird').promisify;
const mkdirp = promisify(require('mkdirp'));

module.exports = function configureLogger() {
  const logLocation = path.join(
    process.env.HOME || process.env.TEMP,
    app.config.get('logLocations')[process.platform]
    );

  return mkdirp(logLocation, parseInt('0775', 8))
  .then(() => {
    let logFilePath = path.join(logLocation, app.config.get('mainLogFile'));
    const mainLogger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: logFilePath,
        }),
      ],
    });

    logFilePath = path.join(logLocation, app.config.get('renderLogFile'));
    const renderLogger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: logFilePath,
        }),
      ],
    });

    if (cliOpts.loglevel) {
      mainLogger.level = cliOpts.loglevel;
      mainLogger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
    }

    app.mainLogger = mainLogger;
    app.renderLogger = renderLogger;
  })
  .catch((err) => {
    /* eslint-disable no-console */
    console.log(`Warning: could not create log location at: ${logLocation}`);
    console.log(`Error: ${err}`);
    /* eslint-enable no-console */

    const mainLogger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
      ],
    });

    const renderLogger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
      ],
    });

    if (cliOpts.loglevel) {
      mainLogger.level = cliOpts.loglevel;
      mainLogger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
      renderLogger.level = cliOpts.loglevel;
      renderLogger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
    }

    app.mainLogger = mainLogger;
    app.renderLogger = renderLogger;
  });
};
