const winston = require('winston');

winston.loggers.add('pipeline', {
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
const defaultLogger = winston.loggers.get('pipeline');
defaultLogger.level = 'silly'; // process.LOGLEVEL ? process.LOGLEVEL : 'info';
let logger = defaultLogger;

module.exports = {
  logger,
  init(opts) {
    logger = opts.logger || defaultLogger;
  },
};
