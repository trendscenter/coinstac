const winston = require('winston');

winston.loggers.add('pipeline', {
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
const defaultLogger = winston.loggers.get('pipeline');
defaultLogger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';
const logger = defaultLogger;

module.exports = {
  logger,
  init(opts) {
    this.logger = opts.logger || defaultLogger;
  },
};
