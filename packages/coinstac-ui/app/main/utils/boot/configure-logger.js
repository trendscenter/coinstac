'use strict';

const app = require('ampersand-app');
const path = require('path');
const cliOpts = require('app/main/utils/boot/parse-cli-input.js').get();
const config = require('../../../config.js');
const winston = require('winston');
const promisify = require('bluebird').promisify;
const mkdirp = promisify(require('mkdirp'));

const resolveHome = (filepath) => {
  return filepath.replace(/~|\$HOME/, process.env.HOME);
}

module.exports = function configureLogger() {
  const logLocation = resolveHome(app.config.get('logLocations')[process.platform]);

  return mkdirp(logLocation, parseInt('0775', 8))
  .then(() => {
    const logPath = path.join(logLocation, app.config.get('logFile'));
    const logger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: logPath,
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
    console.log(`Warning: could not create log location at: ${logLocation}`);
    console.log(`Error: ${err}`);
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
