'use strict';

const net = require('net');
const Readable = require('stream').Readable;
const { spawn } = require('child_process');

const createWebServer = (requestHandler) => {
  const server = net.createServer();

  const handleConnection = (socket) => {
    // Subscribe to the readable event once so we can start calling .read()
    socket.once('readable', () => {
      // Parse headers out of socket
      let reqBuffer = Buffer.alloc(0);
      let found = false;
      const parseHeaders = (chunk) => {
        if (!found) {
          reqBuffer = Buffer.concat([reqBuffer, chunk]);
          const marker = reqBuffer.indexOf('\r\n\r\n');
          if (marker !== -1) {
            found = true;
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
        }
      };
      socket.on('data', parseHeaders);
    });
  };

  server.on('connection', handleConnection);

  return server;
};

const callCommand = (control, inputStream) => {
  const cmd = spawn(control.command, control.args);
  if (inputStream) {
    cmd.stdin.pipe();
  }
};

/**
 * Create server to handle docker requests
 * @type {Function}  request handler
 */
const webServer = createWebServer((req, res) => {
  // debugger
  // let buf;
  // let command;
  // let count = 0;
  // let reqBuffer = Buffer.alloc(0);
  //
  // while (buf !== null) {
  //   buf = req.socket.read();
  //   if (buf === null) break;
  //
  //   reqBuffer = Buffer.concat([reqBuffer, buf]);
    // let idx;
    // while (count !== 4) {
    //   idx = reqBuffer.indexOf('\r\n');
    //   if (idx !== -1) {
    //     count += 1;
    //     if (count === 2) {
    //       command = reqBuffer.slice(0, idx).toString();
    //     } else {
    //       reqBuffer = reqBuffer.slice(idx + 2);
    //     }
    //   }
    // }
    // if (count === 4) {
    //   req.socket.unshift(reqBuffer);
    //   break;
    // }
  // }
  let reqBuffer = Buffer.alloc(0);
  let found = false;
  req.socket.on('data', (chunk) => {
    debugger
    if (!found) {
      reqBuffer = Buffer.concat([reqBuffer, chunk]);
      console.log(reqBuffer.length);
      const marker = reqBuffer.indexOf('\r\n\r\n');
      if (marker !== -1) {
        debugger
        found = true;
      }
    }
  });
  // const streamProxy = Readable();
  //
  // streamProxy._read = (size) => {
  //   let buf = req.socket.read(size);
  //   if (buf === null) streamProxy.push(buf);
  //   const idx = buf.indexOf('0\r\n\r\n');
  //   if (idx !== -1) {
  //     debugger
  //     buf = buf.slice(0, idx);
  //   }
  //   streamProxy.push(buf);
  // };
  //
  // let streamBuf = Buffer.alloc(0);
  // streamProxy.on('data', (chunk) => {
  //   debugger
  //   streamBuf = Buffer.concat([streamBuf, chunk]);
  //   debugger
  // });
  // streamProxy.on('end', () => {
  //   debugger;
  //   const stuff = JSON.parse(streamBuf.toString());
  //   debugger;
  //   res.end('Hello World!');
  // })
  // callCommand(JSON.parse(command), streamProxy);
});

/**
 * start the coinstac docker server
 * @param  {Object} opts opts passed to net.listen
 * @return {Promise}      resolves on listening
 */
const start = (opts) => {
  webServer.on('error', (e) => {
    console.log('Server Error'); // eslint-disable-line no-console
    console.log(e); // eslint-disable-line no-console
  });

  return new Promise((resolve) => {
    webServer.listen(opts, () => {
      resolve();
    });
  });
};

module.exports = {
  start,
};
