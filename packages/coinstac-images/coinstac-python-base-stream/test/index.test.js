const test = require('ava').test;
const pify = require('util').promisify;
const request = require('request-stream');
const server = require('../server');
const { createReadStream } = require('fs');
const resolvePath = require('path').resolve;

test.before(() => {
  return server.start({ port: 3223 });
});

test('test run route', (t) => {
  return new Promise((resolve, reject) => {
    const req = request('localhost:3223/run', { method: 'POST' }, (err, res) => {
      let buf = '';
      if (err) {
        reject(err);
      }

      res.on('data', (chunk) => {
        buf += chunk;
      });
      res.on('end', () => resolve(buf));
      res.on('error', e => reject(e));
    });

    const fsStream = createReadStream(resolvePath(__dirname, 'one.json'));
    const control = {
      command: 'ls',
      args: ['./'],
    };
    req.write(JSON.stringify(control));
    fsStream.on('data', (chunk) => {
      req.write(chunk);
    })
    fsStream.on('end', () => {
      debugger
      req.end();
    })
  }).then((data) => {
    debugger;
  })
});

test.after.always('cleanup', () => {
});
