'use strict';

const app = require('ampersand-app');
const cliOpts = require('app/main/utils/boot/parse-cli-input.js').get();
const config = require('../../../config.js');
const winston = require('winston');

module.exports = function configureLogger() {
    const logger = new winston.Logger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: `./${app.config.get('logFile')}` || './coinstac-log.json',
        }),
      ],
    });

    if (cliOpts.loglevel) {
      logger.level = cliOpts.loglevel;
      logger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
    }

    app.logger = logger;
};
