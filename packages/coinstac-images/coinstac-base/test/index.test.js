'use strict';

import test from 'ava';

const { createReadStream, readFileSync, unlink } = require('fs');
const resolvePath = require('path').resolve;
const unzip = require('unzipper');
const ss = require('socket.io-stream');
const socketIOClient = require('socket.io-client');
const server = require('../server-ws');

test.before(() => {
  return server.start({ port: 3223 })
    .then(() => {
      return new Promise((resolve, reject) => {
        createReadStream(resolvePath(__dirname, 'large.json.zip'))
          .pipe(unzip.Extract({ path: __dirname }))
          .on('close', () => resolve())
          .on('error', e => reject(e));
      });
    });
});

test('test run route', (t) => {
  const fsStream = createReadStream(resolvePath(__dirname, 'large.json'));
  const control = {
    command: 'node',
    args: [resolvePath(__dirname, 'check.js')],
  };
  const socket = socketIOClient('http://localhost:3223');

  const stream = ss.createStream();
  ss(socket).emit('run', stream, { control });
  fsStream.pipe(stream);

  const stdoutProm = new Promise((resolve, reject) => {
    let stdout = '';
    ss(socket).on('stdout', (stream) => {
      stream.on('data', (chunk) => {
        stdout += chunk;
      });
      stream.on('end', () => resolve(stdout));
      stream.on('err', err => reject(err));
    });
  });

  const stderrProm = new Promise((resolve, reject) => {
    let stderr = '';
    ss(socket).on('stderr', (stream) => {
      stream.on('data', (chunk) => {
        stderr += chunk;
      });
      stream.on('end', () => resolve(stderr));
      stream.on('err', err => reject(err));
    });
  });

  const endProm = new Promise((resolve) => {
    socket.on('exit', (data) => {
      resolve(data);
    });
  });
  return Promise.all([stdoutProm, stderrProm, endProm])
    .then((inData) => {
      if (inData[2].error) throw new Error(inData[2].error);
      const orig = readFileSync(resolvePath(__dirname, './large.json')).toString();
      t.true(orig === inData[0] && orig === inData[1] && inData[2].code === 0);
    });
});

test.after.always('cleanup', () => {
  return new Promise((resolve, reject) => {
    unlink(resolvePath(__dirname, './large.json'), (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});
