'use strict';

const winston = require('winston');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      level: 'verbose',
    }),
  ],
});

function getProcessLogger(childProcess, name, mode = 'info') {
  return function processLogger(data) {
    logger[mode](`${name} [${childProcess.pid}]: ${data.slice(0, -1)}`);
  };
}

module.exports = {
  getProcessLogger,
  logger,
};
