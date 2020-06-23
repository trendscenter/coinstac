'use strict';

const test = require('ava');
const { createReadStream, readFileSync, unlink } = require('fs');
const resolvePath = require('path').resolve;
const unzip = require('unzipper');
const WS = require('ws');
const server = require('../server-ws2');

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
  const ddd = readFileSync(resolvePath(__dirname, './large.json'));
  console.time('Execute Time'); // eslint-disable-line no-console
  const control = {
    command: 'node',
    args: [resolvePath(__dirname, 'check.js')],
  };
  const ws = new WS('ws://localhost:3223');

  ws.on('open', () => {
    ws.send(JSON.stringify(control));
    ws.send(ddd);
    ws.send(null);
  });
  const prom = new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let outfin = false;
    let errfin = false;
    let code;
    ws.on('message', (data) => {
      let res;
      try {
        res = JSON.parse(data);
      } catch (e) {
        ws.close(1011, 'Data parse error');
        return reject(e);
      }
      switch (res.type) {
        case 'error':
          ws.close(1011, 'Computation start error');
          return reject(res.error);
        case 'stderr':
          errfin = res.end;
          stderr += res.data || '';
          if (code !== undefined && outfin && errfin) {
            ws.close(1000, 'Client disconnect');
            resolve({
              code,
              stdout,
              stderr,
            });
          }
          break;
        case 'stdout':
          outfin = res.end;
          stdout += res.data || '';
          if (code !== undefined && outfin && errfin) {
            try {
              stdout = JSON.parse(stdout);
            } catch (e) {
              ws.close(1011, 'Output parse error');
              return reject(e);
            }
            ws.close(1000, 'Client disconnect');
            resolve({
              code,
              stdout,
              stderr,
            });
          } else if (outfin) {
            try {
              stdout = JSON.parse(stdout);
            } catch (e) {
              ws.close(1011, 'Output parse error');
              return reject(e);
            }
          }
          break;
        case 'close':
          ({ code } = res);
          if (code !== 0) {
            ws.close(1011, 'Computation error');
            return reject(new Error(`Computation failed with exitcode ${code} stderr ${stderr}`));
          }
          if (outfin && errfin) {
            resolve({
              code,
              stdout,
              stderr,
            });
          }
          break;
        default:
      }
    });
  });

  return prom.then((p) => {
    console.timeEnd('Execute Time'); // eslint-disable-line no-console
    const echoData = readFileSync(resolvePath(__dirname, './large.json'));
    const testData = { code: 0, stdout: JSON.parse(echoData), stderr: echoData.toString() };
    t.deepEqual(p, testData);
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
