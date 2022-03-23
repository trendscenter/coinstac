'use strict';

const winston = require('winston');

// eslint-disable-next-line no-console
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});

logger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';


module.exports = {
  logger,
  setLogger(overideLogger) { this.logger = overideLogger; },
  setTimeoutPromise(delay) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  },
};
