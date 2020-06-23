'use strict';

const test = require('ava');
const request = require('request-stream');
const { createReadStream, readFileSync, unlink } = require('fs');
const resolvePath = require('path').resolve;
const unzip = require('unzipper');
const server = require('../server-http');

test.before(() => {
  return server.start({ port: 3224 })
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
  console.time('Execute Time'); // eslint-disable-line no-console
  return new Promise((resolve, reject) => {
    const req = request('localhost:3224/run', { method: 'POST' }, (err, res) => {
      let buf = '';
      if (err) {
        return reject(err);
      }

      res.on('data', (chunk) => {
        buf += chunk;
      });
      res.on('end', () => resolve(buf));
      res.on('error', e => reject(e));
    });

    const fsStream = createReadStream(resolvePath(__dirname, 'large2.json'));
    const control = {
      command: 'node',
      args: [resolvePath(__dirname, 'check.js')],
    };
    req.write(JSON.stringify(control));
    fsStream.on('data', (chunk) => {
      req.write(chunk);
    });
    fsStream.on('end', () => {
      req.end();
    });
  }).then((inData) => {
    let errMatch;
    let outMatch;
    let codeMatch;
    let endMatch;
    let errData = Buffer.alloc(0);
    let outData = Buffer.alloc(0);
    let code = Buffer.alloc(0);

    const orig = readFileSync(resolvePath(__dirname, './large2.json'));
    let data = Buffer.from(inData);
    while (outMatch !== -1 || errMatch !== -1 || codeMatch !== -1) {
      outMatch = data.indexOf('stdoutSTART\n');
      endMatch = data.indexOf('stdoutEND\n');
      if (outMatch !== -1 && endMatch !== -1) {
        outData = Buffer.concat([outData, data.slice(outMatch + 'stdoutSTART\n'.length, endMatch)]);
        data = Buffer.concat([data.slice(0, outMatch), data.slice(endMatch + 'stdoutEND\n'.length)]);
      }
      errMatch = data.indexOf('stderrSTART\n');
      endMatch = data.indexOf('stderrEND\n');
      if (errMatch !== -1 && endMatch !== -1) {
        errData = Buffer.concat([errData, data.slice(errMatch + 'stderrSTART\n'.length, endMatch)]);
        data = Buffer.concat([data.slice(0, errMatch), data.slice(endMatch + 'stderrEND\n'.length)]);
      }
      codeMatch = data.indexOf('exitcodeSTART\n');
      endMatch = data.indexOf('exitcodeEND\n');
      if (codeMatch !== -1 && endMatch !== -1) {
        code = Buffer.concat([code, data.slice(codeMatch + 'exitcodeSTART\n'.length, endMatch)]);
        data = Buffer.concat([data.slice(0, codeMatch), data.slice(endMatch + 'exitcodeEND\n'.length)]);
      }
    }
    console.timeEnd('Execute Time'); // eslint-disable-line no-console
    t.true(orig.compare(outData) && orig.compare(errData) && code.toString() === '0');
  });
});

test.after.always('cleanup', () => {
  return new Promise((resolve, reject) => {
    unlink(resolvePath(__dirname, './large2.json'), (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});
