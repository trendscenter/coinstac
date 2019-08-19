'use strict';

const path = require('path');
const stream = require('stream');
const winston = require('winston');
const pify = require('util').promisify;
const mkdirp = pify(require('mkdirp'));
const cliOpts = require('./parse-cli-input.js').get();

module.exports = function configureLogger(config) {
  const logLocation = path.join(
    process.env.HOME || process.env.TEMP,
    config.get('logLocations')[process.platform]
  );

  return mkdirp(logLocation, 0o0775)
    .then(() => {
      const logFilePath = path.join(logLocation, config.get('logFile'));
      const logger = winston.createLogger({
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({
            filename: logFilePath,
          }),
          new winston.transports.Stream({
            stream: new stream.Writable({
              write: (chunk, encoding, done) => {
                logger.emit('log-message', { data: chunk.toString() });
                done();
              },
            }),
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
