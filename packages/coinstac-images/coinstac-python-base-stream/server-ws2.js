'use strict';

require('trace');
require('clarify');
const { spawn } = require('child_process');
const winston = require('winston');
const WS = require('ws');

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
process.on('uncaughtException', (err) => {
  logger.error(`Server Error: ${err.stack}`);
});

/**
* start the coinstac docker server
* @param  {Object} opts opts passed to net.listen
* @return {Promise}      resolves on listening
*/
const start = (opts) => {
  logger.level = opts.level ? opts.level : 'info';
  return new Promise((resolve, reject) => {
    const wss = new WS.Server({
      port: opts.port,
      perMessageDeflate: false,
    }, (err) => {
      if (err) return reject(err);
      resolve();
    });

    wss.on('connection', (ws) => {
      let firstMessage = true;
      let cmd;
      ws.on('message', (message) => {
        if (firstMessage) {
          const task = JSON.parse(message);
          firstMessage = false;
          logger.debug(`Command: ${JSON.stringify(task)}`);
          cmd = spawn(task.command, task.args);

          cmd.stdout.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'stdout', data: data.toString(), end: false }));
          });

          cmd.stdout.on('close', () => {
            ws.send(JSON.stringify({ type: 'stdout', end: true }));
          });

          cmd.stderr.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'stderr', data: data.toString(), end: false }));
          });

          cmd.stderr.on('close', () => {
            ws.send(JSON.stringify({ type: 'stderr', end: true }));
          });

          cmd.on('close', (code) => {
            ws.send(JSON.stringify({ type: 'close', code }));
            if (code !== 0) {
              logger.error(`${task.command} exited with code ${code}`);
            }
          });
          cmd.on('error', (error) => {
            ws.send(JSON.stringify({ type: 'error', error }));
            logger.error(`Process failed to start:\n${error}`);
          });
        } else if (Buffer.isBuffer(message) && message.length === 0) {
          cmd.stdin.end();
        } else {
          cmd.stdin.write(message);
        }
      });
      ws.on('close', (message) => {
        logger.info(`Client socket close: ${JSON.stringify(message)}`);
      });
    });
  });
};

module.exports = {
  start,
};
