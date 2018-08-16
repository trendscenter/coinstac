'use strict';

const net = require('net');
require('trace');
require('clarify');
const Transform = require('stream').Transform;
const { spawn } = require('child_process');

process.on('uncaughtException', (err) => {
  debugger
  console.log('Server Error:'); // eslint-disable-line no-console
  console.log(err); // eslint-disable-line no-console
  console.log(err.stack); // eslint-disable-line no-console
});

const createWebServer = (requestHandler) => {
  const server = net.createServer();

  server.on('error', (e) => {
    console.log('Server Error'); // eslint-disable-line no-console
    console.log(e); // eslint-disable-line no-console
    console.log(e.stack); // eslint-disable-line no-console
  });

  const handleConnection = (socket) => {
    // Subscribe to the readable event once so we can start calling .read()
    socket.on('error', (e) => {
      console.log('Server Socket error:'); // eslint-disable-line no-console
      console.log(e); // eslint-disable-line no-console
    });
    socket.once('readable', () => {
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
                socket.write('\r\n');
              } else {
                socket.write(chunk);
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
                  socket.write('\r\n');
                }
                socket.end('0\r\n\r\n');
              } else {
                socket.end(chunk);
              }
            },
            setHeader,
            setStatus(newStatus, newStatusText) {
              status = newStatus;
              statusText = newStatusText;
            },
            // Convenience method to send JSON through server
            json(data) {
              if (headersSent) {
                throw new Error('Headers sent, cannot proceed to send JSON');
              }
              const json = new Buffer(JSON.stringify(data));
              setHeader('content-type', 'application/json; charset=utf-8');
              setHeader('content-length', json.length);
              sendHeaders();
              socket.end(json);
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
  const cmd = spawn(control.command, control.args);
  if (inputStream) {
    inputStream.pipe(cmd.stdin);
  }
  cmd.stdout.on('data', (data) => {
    res.write(`stdoutSTART\n${data}stdoutEND\n`);
  });

  cmd.stderr.on('data', (data) => {
    res.write(`stderrSTART\n${data}stderrEND\n`);
    console.log(`stderr:\n${data}`); // eslint-disable-line no-console
  });

  cmd.on('close', (code) => {
    res.end(`exitcodeSTART\n${code}exitcodeEND\n`);
    if (code !== 0) {
      console.log(`${control.command} exited with code ${code}`); // eslint-disable-line no-console
    }
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

      // keep track of our pos in the data stream
      let sepCount = 0;
      let last = false;
      streamProxy._transform = (chunk, encoding, cb) => {
        const endMarker = chunk.indexOf('0\r\n\r\n');
        if (endMarker !== -1) {
          chunk = chunk.slice(0, endMarker);
          last = true;
        }
        let sep;
        let container = Buffer.alloc(0);
        while (sep !== -1) {
          sep = chunk.indexOf('\r\n');
          if (sep !== -1) {
            sepCount += 1;
            if (sepCount & 1) { // eslint-disable-line no-bitwise
              // odd
              // after first byte counter lies the control string
              chunk = chunk.slice(sep + 2);
              if (chunk.indexOf('\r\n') === -1) {
                // either data or nothing left, concat
                container = Buffer.concat([container, chunk]);
              }
            } else {
              // even
              // take off chunked delim until data stream
              container = Buffer.concat([container, chunk.slice(0, sep)]);
              chunk = chunk.slice(sep + 2);
            }
          }
        }
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
  };
  req.socket.on('data', parseCommand);
});

/**
* start the coinstac docker server
* @param  {Object} opts opts passed to net.listen
 * @return {Promise}      resolves on listening
 */
const start = (opts) => {
  return new Promise((resolve) => {
    webServer.listen(opts, () => {
      resolve();
    });
  });
};

module.exports = {
  start,
};
