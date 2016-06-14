'use strict';

const winston = require('winston');
const level = process.env.COINSTAC_SERVER_LOG_LEVEL || 'info';

/**
 * @module service/logger
 */

/**
 * {@link https://www.npmjs.com/package/winston}
 */
const logger = new (winston.Logger)({
  transports: [new (winston.transports.Console)({ level })],
});

module.exports = logger;
