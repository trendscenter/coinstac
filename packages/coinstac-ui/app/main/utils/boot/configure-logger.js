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
    const logFilePath = path.join(logLocation, app.config.get('logFile'));
    const logger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: logFilePath,
        }),
      ],
    });

    if (cliOpts.loglevel) {
      logger.level = cliOpts.loglevel;
      logger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
    }

    app.logger = logger;
  })
  .catch((err) => {
    /* eslint-disable no-console */
    console.log(`Warning: could not create log location at: ${logLocation}`);
    console.log(`Error: ${err}`);
    /* eslint-enable no-console */

    const logger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
      ],
    });

    if (cliOpts.loglevel) {
      logger.level = cliOpts.loglevel;
      logger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
    }

    app.logger = logger;
  });
};
