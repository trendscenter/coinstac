'use strict';

const path = require('path');
const winston = require('winston');
const pify = require('util').promisify;
const mkdirp = pify(require('mkdirp'));
const readFile = pify(require('fs').readFile);
const writeFile = pify(require('fs').writeFile);
const open = pify(require('fs').open);
const close = pify(require('fs').close);
const cliOpts = require('./parse-cli-input.js').get();

module.exports = function configureLogger(config) {
  const logLocation = path.join(
    process.env.HOME || process.env.TEMP,
    config.get('logLocations')[process.platform]
  );

  const logFilePath = path.join(logLocation, config.get('logFile'));
  return mkdirp(logLocation, 0o0775)
    .then(() => open(logFilePath, 'a'))
    .then(fd => close(fd))
    .then(() => {
      return readFile(logFilePath, 'utf8')
        .then((file) => {
          // trim down the log file
          const len = file.split('\n').length;
          if (len > 1000) {
            const trimmed = file.tosplit('\n').slice(len - 1000, len);
            return writeFile(logLocation, trimmed);
          }
        });
    })
    .then(() => {
      winston.loggers.add('coinstac-main', {
        level: 'silly',
        transports: [
          new winston.transports.Console({ format: winston.format.timestamp() }),
          new winston.transports.File({
            filename: logFilePath,
          }),
        ],
      });
      const logger = winston.loggers.get('coinstac-main');

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

      winston.loggers.add('coinstac-main', {
        level: 'silly',
        transports: [
          new winston.transports.Console({ format: winston.format.cli() }),
        ],
      });
      const logger = winston.loggers.get('coinstac-main');

      if (cliOpts.loglevel) {
        logger.level = cliOpts.loglevel;
        logger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
      }

      return logger;
    });
};
