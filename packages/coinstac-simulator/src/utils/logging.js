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

/**
 * Get a `data` event handler for a stdout or stderr stream.
 *
 * @param {ChildProcess} childProcess
 * @param {string} name Give it a name for easy identification
 * @param {string} [mode='info'] Logger mode
 * @returns {Function} event handler
 */
function getStdDataHandler(childProcess, name, mode = 'info') {
  return function stdDataHandler(data) {
    logger[mode](`${name} [${childProcess.pid}]: ${data.slice(0, -1)}`);
  };
}

/**
 * Get a logger for a client or server child process.
 *
 * @param {string} [level='verbose']
 * @returns {Winston} Re-configured logger instance
 */
function getChildProcessLogger(level = 'verbose') {
  logger.configure({
    level,
    transports: [
      new (winston.transports.Console)({
        /** {@link https://www.npmjs.com/package/winston#custom-log-format} */
        formatter: options => options.message ? options.message : '',
      }),
    ],
  });

  return logger;
}

module.exports = {
  getChildProcessLogger,
  getStdDataHandler,
  logger,
};
