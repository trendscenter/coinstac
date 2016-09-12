'use strict';

const mkdirp = require('mkdirp');
const path = require('path');
const pify = require('pify');
const touch = require('touch');
const winston = require('winston');

/**
 * @module service/logger
 *
 * {@link https://www.npmjs.com/package/winston}
 */

/**
 * Log file directory.
 *
 * @const {string}
 */
const LOG_DIR = '/var/log/coinstac';

/**
 * Log file name.
 *
 * @const {string}
 */
const LOG_BASE = 'application.log';

/**
 * Logger instance.
 *
 * @type {winston.Logger}
 */
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      level: 'info',
    }),
  ],
});

/**
 * Set up file transport async. If an error occurs the executable will catch the
 * unhandled rejection and shut the server down.
 */
pify(mkdirp)(LOG_DIR)
  .then(() => pify(touch)(path.join(LOG_DIR, LOG_BASE)))
  .catch(() => {
    throw new Error(
      `Couldn't create log file: ${path.join(LOG_DIR, LOG_BASE)}`
    );
  })
  .then(() => {
    logger.add(winston.transports.File, {
      filename: path.join(LOG_DIR, LOG_BASE),
      level: 'silly',
      silent: false,
    });
  });

module.exports = logger;
