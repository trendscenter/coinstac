'use strict';

const winston = require('winston');

const levels = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 };
const colors = {
  error: 'red',
  warn: 'orange',
  info: 'cyan',
  verbose: 'blue',
  debug: 'green',
  silly: 'pink',
};

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      levels,
      colorize: true,
    }),
  ],
});
winston.addColors(colors);

logger.level = 'verbose';

module.exports = logger;
