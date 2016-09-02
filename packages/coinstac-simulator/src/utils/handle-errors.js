'use strict';

require('trace');
require('clarity');

Error.stackTraceLimit = Infinity;

const { logger } = require('./logging');

/**
 * {@link https://nodejs.org/api/process.html#process_event_uncaughtexception}
 */
process.on('uncaughtExpection', error => {
  logger.error(error);
  process.exit(1);
});

/**
 * {@link https://nodejs.org/api/process.html#process_event_unhandledrejection}
 */
process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  process.exit(1);
});
