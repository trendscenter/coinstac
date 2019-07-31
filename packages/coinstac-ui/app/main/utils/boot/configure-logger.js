'use strict';

const path = require('path');
const winston = require('winston');
const pify = require('util').promisify;
const mkdirp = pify(require('mkdirp'));
const readFile = pify(require('fs').readFile);
const writeFile = pify(require('fs').writeFile);
const cliOpts = require('./parse-cli-input.js').get();

module.exports = function configureLogger(config) {
  const logLocation = path.join(
    process.env.HOME || process.env.TEMP,
    config.get('logLocations')[process.platform]
  );

  const logFilePath = path.join(logLocation, config.get('logFile'));
  return mkdirp(logLocation, 0o0775)
    .then(() => {
      return readFile(logFilePath)
        .then((file) => {
          // trim down the log file
          const len = file.split('\n').length;
          if (len > 1000) {
            const trimmed = file.split('\n').slice(len - 1000, len);
            return writeFile(logLocation, trimmed);
          }
        }).catch(); // we dont care if it doesn't exist
    })
    .then(() => {
      const logger = new winston.Logger({
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({
            filename: logFilePath,
          }),
        ],
      });
      logger.level = 'silly';

      if (cliOpts.loglevel) {
        logger.level = cliOpts.loglevel;
        logger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
      }

      return logger;
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
      logger.level = 'silly';

      if (cliOpts.loglevel) {
        logger.level = cliOpts.loglevel;
        logger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
      }

      return logger;
    });
};
