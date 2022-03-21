const winston = require('winston');


const logger = winston.createLogger({
  level: 'silly',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({
      level, message, timestamp,
    }) => `${timestamp} { message: ${message}, level: ${level} }`)
  ),
  transports: [new winston.transports.Console()],
});

logger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';


module.exports = {
  logger,
  init(opts) {
    this.logger = opts.logger || logger;
  },
};
