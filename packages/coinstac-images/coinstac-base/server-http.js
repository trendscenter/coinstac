'use strict';

const net = require('net');
require('trace');
require('clarify');
const { Transform } = require('stream');
const { spawn } = require('child_process');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
process.on('uncaughtException', (err) => {
  logger.error(`Server Error: ${err.stack}`);
});

const createWebServer = (requestHandler) => {
  const server = net.createServer()
    .on('error', (err) => {
      logger.error(`Server Error: ${err.stack}`);
    });

  const handleConnection = (socket) => {
    // Subscribe to the readable event once so we can start calling .read()
    socket.on('error', (e) => {
      console.log('Server Socket error:'); // eslint-disable-line no-console
      console.log(e); // eslint-disable-line no-console
    });
    socket.once('readable', () => {
      logger.debug('Received incoming connection');
      // Parse headers out of socket
      let reqBuffer = Buffer.alloc(0);
      const parseHeaders = (chunk) => {
        reqBuffer = Buffer.concat([reqBuffer, chunk]);
        const marker = reqBuffer.indexOf('\r\n\r\n');
        if (marker !== -1) {
          // If we reached \r\n\r\n, there could be data after it. Take note.
          const remaining = reqBuffer.slice(marker + 4);
          // The header is everything we read, up to and not including \r\n\r\n
          const reqHeader = reqBuffer.slice(0, marker).toString();
          // This pushes the extra data we read back to the socket's readable stream
          socket.pause();
          socket.unshift(remaining);
          /* Request-related business */
          // Start parsing the header
          const reqHeaders = reqHeader.split('\r\n');
          // First line is special
          const reqLine = reqHeaders.shift().split(' ');
          // Further lines are one header per line, build an object out of it.
          const headers = reqHeaders.reduce((acc, currentHeader) => {
            const [key, value] = currentHeader.split(':');
            return {
              ...acc,
              [key.trim().toLowerCase()]: value.trim(),
            };
          }, {});
          logger.debug(`Parsed header: ${JSON.stringify(headers)}`);
          // This object will be sent to the handleRequest callback.
          const request = {
            method: reqLine[0],
            url: reqLine[1],
            httpVersion: reqLine[2].split('/')[1],
            headers,
            socket,
          };
          let status = 200;
          let statusText = 'OK';
          let headersSent = false;
          let isChunked = false;

          const responseHeaders = {
            server: 'coinstac',
          };

          const setHeader = (key, value) => {
            responseHeaders[key.toLowerCase()] = value;
          };

          const sendHeaders = () => {
            // Only do this once :)
            if (!headersSent) {
              headersSent = true;
              // Add the date header
              setHeader('date', new Date().toGMTString());
              // Send the status line
              socket.write(`HTTP/1.1 ${status} ${statusText}\r\n`);
              logger.info(`Response header: HTTP/1.1 ${status} ${statusText}\r\n`);
              // Send each following header
              Object.keys(responseHeaders).forEach((headerKey) => {
                socket.write(`${headerKey}: ${responseHeaders[headerKey]}\r\n`);
              });
              // Add the final \r\n that delimits the response headers from body
              socket.write('\r\n');
            }
          };

          const response = {
            write(chunk) {
              if (!headersSent) {
                // If there's no content-length header, then specify Transfer-Encoding chunked
                if (!responseHeaders['content-length']) {
                  isChunked = true;
                  setHeader('transfer-encoding', 'chunked');
                }
                sendHeaders();
              }
              if (isChunked) {
                const size = chunk.length.toString(16);
                socket.write(`${size}\r\n`);
                socket.write(chunk);
                logger.silly(`Socket data: ${chunk}`);
                socket.write('\r\n');
              } else {
                socket.write(chunk);
                logger.silly(`Socket data: ${chunk}`);
              }
            },
            end(chunk) {
              if (!headersSent) {
                // We know the full length of the response, let's set it
                if (!responseHeaders['content-length']) {
                  // Assume that chunk is a buffer, not a string!
                  setHeader('content-length', chunk ? chunk.length : 0);
                }
                sendHeaders();
              }
              if (isChunked) {
                if (chunk) {
                  const size = (chunk.length).toString(16);
                  socket.write(`${size}\r\n`);
                  socket.write(chunk);
                  logger.silly(`Socket data: ${chunk}`);
                  socket.write('\r\n');
                }
                socket.end('0\r\n\r\n');
              } else {
                socket.end(chunk);
                logger.silly(`Socket end: ${chunk}`);
              }
            },
            setHeader,
            setStatus(newStatus, newStatusText) {
              status = newStatus;
              statusText = newStatusText;
            },
          };

          /* Finally call Handler */
          socket.removeListener('data', parseHeaders);
          requestHandler(request, response);
          socket.resume();
        }
      };
      socket.on('data', parseHeaders);
    });
  };

  server.on('connection', handleConnection);

  return server;
};

const callCommand = (control, inputStream, res) => {
  logger.debug(`Command: ${JSON.stringify(control)}`);
  const cmd = spawn(control.command, control.args);
  if (inputStream) {
    inputStream.pipe(cmd.stdin);
  }
  cmd.stdout.on('data', (data) => {
    res.write(`stdoutSTART\n${data}stdoutEND\n`);
  });

  cmd.stderr.on('data', (data) => {
    res.write(`stderrSTART\n${data}stderrEND\n`);
    logger.error(`stderr:\n${data}`); // eslint-disable-line no-console
  });

  cmd.on('close', (code) => {
    res.end(`exitcodeSTART\n${code}exitcodeEND\n`);
    if (code !== 0) {
      logger.error(`${control.command} exited with code ${code}`); // eslint-disable-line no-console
    }
  });
  cmd.on('error', (err) => {
    res.end(`stderrSTART\n${err}stderrEND\n`);
    logger.error(`Process failed to start:\n${err}`); // eslint-disable-line no-console
  });
};

/**
* Create server to handle docker requests
* @type {Function}  request handler
*/
const webServer = createWebServer((req, res) => {
  let control;
  let reqBuffer = Buffer.alloc(0);
  let count = 0;

  const parseCommand = (chunk) => {
    reqBuffer = Buffer.concat([reqBuffer, chunk]);
    // do we have the control and first part of the
    // data stream? This makes shifting it back to the socket
    // easier
    if (req.headers['transfer-encoding'] && req.headers['transfer-encoding'] === 'chunked') {
      if (count !== 3) {
        let idx;
        // we want to parse the first three delims
        // go until there are no more occurances
        // or until we've found all we want
        while (idx !== -1 && count < 3) {
          idx = reqBuffer.indexOf('\r\n');
          if (idx !== -1) {
            count += 1;
            if (count === 2) {
              // after first byte counter lies the control string
              control = JSON.parse(reqBuffer.slice(0, idx).toString());
            } else {
              // take off chunked delim until data stream
              reqBuffer = reqBuffer.slice(idx + 2);
            }
          }
        }
      }
      // found last delim, cleanup and remove listener
      if (count === 3) {
        req.socket.pause();
        req.socket.removeListener('data', parseCommand);
        req.socket.unshift(reqBuffer);

        const streamProxy = Transform();

        /*
        Parse out the data using the given byte-length in the chunked stream
         */
        let byteCounter = 0;
        let byteTemp;
        let parseCounter = true;
        let last = false;
        streamProxy._transform = (chunk, encoding, cb) => {
          let sep;
          let container = Buffer.alloc(0);

          const endMarker = chunk.indexOf('0\r\n\r\n');
          if (endMarker !== -1) {
            chunk = chunk.slice(0, endMarker);
            last = true;
          }
          while (sep !== -1) {
            if (parseCounter) {
              sep = chunk.indexOf('\r\n');
              byteCounter = parseInt(byteTemp
                ? byteTemp + chunk.slice(0, sep).toString : chunk.slice(0, sep).toString(), 16);
              byteTemp = undefined;
              chunk = chunk.slice(sep + 2);
              parseCounter = false;
            }
            // + 2 for the next delim to make parsing easier
            if (chunk.length < byteCounter + 2) {
              container = Buffer.concat([container, chunk]);
              byteCounter -= chunk.length;
              break;
            } else {
              container = Buffer.concat([container, chunk.slice(0, byteCounter)]);
              chunk = chunk.slice(byteCounter + 2);
              sep = chunk.indexOf('\r\n');
              if (sep === -1) {
                byteTemp = chunk.toString();
                parseCounter = true;
              } else {
                byteCounter = parseInt(chunk.slice(0, sep).toString(), 16);
                chunk = chunk.slice(sep + 2);
                parseCounter = false;
              }
            }
          }
          logger.silly(`Input data parsed: ${container.toString()}`);
          streamProxy.push(container);
          if (last) {
            // manually end the stream
            streamProxy.push(null);
          }
          cb();
        };
        req.socket.pipe(streamProxy);
        callCommand(control, streamProxy, res);
        req.socket.resume();
      }
    } else if (reqBuffer.length === parseInt(req.headers['content-length'], 10)) {
      req.socket.removeListener('data', parseCommand);
      callCommand(JSON.parse(reqBuffer.toString()), undefined, res);
    }
  };
  req.socket.on('data', parseCommand);
});

/**
* start the coinstac docker server
* @param  {Object} opts opts passed to net.listen
* @return {Promise}      resolves on listening
*/
const start = (opts) => {
  logger.level = opts.level ? opts.level : 'info';
  return new Promise((resolve) => {
    webServer.listen(opts, () => {
      resolve();
    });
  });
};

module.exports = {
  start,
};
