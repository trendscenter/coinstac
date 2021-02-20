'use strict';

const path = require('path');
const stream = require('stream');
const winston = require('winston');
const pify = require('util').promisify;
const mkdirp = pify(require('mkdirp'));
const readFile = pify(require('fs').readFile);
const writeFile = pify(require('fs').writeFile);
const open = pify(require('fs').open);
const close = pify(require('fs').close);
const cliOpts = require('./parse-cli-input.js').get();

function buildLogFilePath(config) {
  const logLocation = path.join(
    process.env.HOME || process.env.TEMP,
    config.get('logLocations')[process.platform]
  );

  return path.join(logLocation, config.get('logFile'));
}

async function configureLogger(config) {
  const logFilePath = buildLogFilePath(config);
  const logLocation = path.dirname(logFilePath);

  try {
    await mkdirp(logLocation, 0o0775);

    const fd = await open(logFilePath, 'a');
    await close(fd);

    const file = await readFile(logFilePath, 'utf8');

    // trim down the log file
    const len = file.split('\n').length;
    if (len > 1000) {
      const trimmed = file.split('\n').slice(len - 1000, len);
      await writeFile(logFilePath, trimmed);
    }

    const logger = winston.loggers.add('coinstac-main', {
      level: 'silly',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({
          level, message, timestamp,
        }) => `${timestamp} { message: ${message}, level: ${level} }`)
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: logFilePath,
        }),
        new winston.transports.Stream({
          stream: new stream.Writable({
            write: (chunk, encoding, done) => {
              logger.emit('log-message', { data: chunk.toString() });
              done();
            },
          }),
        }),
      ],
    });

    return logger;
  } catch (err) {
    /* eslint-disable no-console */
    console.log(`Warning: could not create log location at: ${logLocation}`);
    console.log(`Error: ${err}`);
    /* eslint-enable no-console */

    const logger = winston.loggers.add('coinstac-main', {
      level: 'silly',
      transports: [
        new winston.transports.Console({ format: winston.format.cli() }),
      ],
    });

    if (cliOpts.loglevel) {
      logger.level = cliOpts.loglevel;
      logger.verbose(`logLevel set to \`${cliOpts.loglevel}\``);
    }

    return logger;
  }
}

async function readInitialLogContents(config) {
  const logFilePath = buildLogFilePath(config);

  return readFile(logFilePath, 'utf8');
}

module.exports = { configureLogger, readInitialLogContents };
