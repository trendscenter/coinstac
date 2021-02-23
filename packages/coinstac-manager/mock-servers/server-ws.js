'use strict';

const http = require('http');
require('trace');
require('clarify'); // eslint-disable-line import/no-unresolved
const { spawn } = require('child_process');
const winston = require('winston');
const socketIO = require('socket.io');
const ss = require('socket.io-stream');

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
  return new Promise((resolve) => {
    const app = http.createServer();
    // these options are passed down to engineIO, both allow larger transport sizes
    const io = socketIO(app, { pingTimeout: 360000, maxHttpBufferSize: 1E9 });

    const socketServer = (socket) => {
      socket.on('connection', (data) => {
        logger.debug(`Connected to a client: ${data}`);
      });
      socket.on('disconnect', (reason) => {
        logger.debug(`Disconnected from a client: ${reason}`);
      });
      socket.on('error', (error) => {
        logger.error(`Socket error:\n${error}`);
      });
      ss(socket).on('run', (stream, data) => {
        logger.debug(`Command: ${JSON.stringify(data.control)}`);
        const cmd = spawn(data.control.command, data.control.args);
        if (stream) {
          stream.pipe(cmd.stdin);
        }
        const outStream = ss.createStream();
        const errorStream = ss.createStream();

        ss(socket).emit('stdout', outStream);
        cmd.stdout.pipe(outStream);

        ss(socket).emit('stderr', errorStream);
        cmd.stderr.pipe(errorStream);

        cmd.on('close', (code) => {
          socket.emit('exit', { code });
          if (code !== 0) {
            logger.error(`${data.control.command} exited with code ${code}`);
          }
        });
        cmd.on('error', (error) => {
          socket.emit('exit', { error });
          logger.error(`Process failed to start:\n${error}`);
        });
      });
    };

    io.on('connection', socketServer);

    app.listen(opts.port, () => {
      resolve();
    });
  });
};

module.exports = {
  start,
};
