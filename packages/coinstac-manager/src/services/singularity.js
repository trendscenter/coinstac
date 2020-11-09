'use strict';

const { spawn } = require('child_process');
const WS = require('ws');
const utils = require('../utils');

const Container = (args) => {
  let error;
  let stderr = '';
  let stdout = '';
  // mimics docker api for compat
  const State = { Running: true };
  debugger
  const process = spawn('singularity', args);

  return new Promise((resolve, reject) => {
    process.stdout.on('data', (data) => { debugger; stdout += data; });
    process.stderr.on('data', (data) => { stderr += data; });
    process.on('error', e => reject(e));
    process.on('close', (code) => {
      debugger
      if (code !== 0) {
        error = stderr;
        utils.logger.error(error);
        State.Running = false;
      } else {
        utils.logger.silly(stdout);
        State.Running = false;
      }
    });
    resolve({
      error,
      State,
      inspect(cb) {
        if (this.state !== 'running' || process.killed) return cb(new Error(`Singularity container not running: ${this.error}`));
        cb(undefined, this.State);
      },
      stop() {
        return new Promise((resolve, reject) => {
          if (!process.kill()) return reject(new Error('Could not stop singularity container'));
          resolve(true);
        });
      },
    });
  });
};
const startContainer = (args) => {
  return Container(args);
};

module.exports = {
  createService(serviceId, port, opts) {
    utils.logger.silly(`Request to start service ${serviceId}`);
    const command = ['node', '/server/index.js', JSON.stringify({
      level: process.LOGLEVEL,
      server: 'ws',
      port,
    })];
    const tryStartService = () => {
      utils.logger.silly(`Starting service ${serviceId} at port: ${port}`);
      return startContainer(['exec', ...opts, ...command])
        .then((container) => {
          utils.logger.silly(`Starting singularity cointainer: ${serviceId}`);
          utils.logger.silly(`Returning service for ${serviceId}`);
          /**
           * Calls the WS server inside the container
           * with data format:
           * [{command}, {args}, {inputData}]
           * @param  {Array} data  service data to run
           * @return {Promise}     resolves or rejects from service run
           */
          const serviceFunction = (data) => {
            let proxR;
            let proxRj;
            const prox = new Promise((resolve, reject) => {
              proxR = resolve;
              proxRj = reject;
            });
            new Promise((resolve) => {
              let count = 0;
              const testConnection = () => {
                const ws = new WS(`ws://127.0.0.1:${port}`);
                ws.on('open', () => {
                  ws.close(1000, 'Test Connection');
                  resolve();
                });
                ws.on('error', (e) => {
                  if (e.code && (e.code === 'ECONNRESET' || e.code === 'ECONNREFUSED')) {
                    ws.terminate();
                    if (count > 10) {
                      proxRj(new Error('Singularity websocket server timeout exceeded'));
                    } else {
                      count += 1;
                      setTimeout(testConnection, 200 * count);
                    }
                  } else {
                    proxRj(e);
                  }
                });
              };
              testConnection();
            }).then(() => {
              const ws = new WS(`ws://127.0.0.1:${port}`);
              ws.on('open', () => {
                ws.send(JSON.stringify({
                  command: data[0],
                  args: data.slice(1, 2),
                }));
                utils.logger.debug(`Input data size: ${data[2].length}`);
                ws.send(data[2]);
                ws.send(null);
              });
              ws.on('error', (e) => {
                proxRj(e);
              });
              new Promise((resolve, reject) => {
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
                        ws.close(1000, 'Normal Client disconnect');
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
                        ws.close(1000, 'Normal Client disconnect');
                        resolve({
                          code,
                          stdout,
                          stderr,
                        });
                      }
                      break;
                    case 'close':
                      ({ code } = res);
                      if (outfin && errfin) {
                        ws.close(1000, 'Normal Client disconnect');
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
              }).then((output) => {
                utils.logger.debug('Singularity service call finished');
                if (output.code !== 0) {
                  throw new Error(`Computation failed with exitcode ${output.code} and stderr ${output.stderr}`);
                }
                utils.logger.silly(`Docker stderr: ${output.stderr}`);
                utils.logger.debug(`Output size: ${output.stdout.length}`);

                let error;
                try {
                  const parsed = JSON.parse(output.stdout);
                  proxR(parsed);
                } catch (e) {
                  error = e;
                  utils.logger.error(`Computation output serialization failed with value: ${output.stdout}`);
                  error.message = `${error.message}\n Additional computation failure information:\n
                  Error code: ${output.code}\n
                  Stderr: ${output.stderr}
                  `;
                  error.error = `${error.error}\n Additional computation failure information:\n
                  Error code: ${output.code}\n
                  Stderr: ${output.stderr}
                  `;
                  throw error;
                }
              }).catch((e) => {
                proxRj(e);
              });
            });
            return prox;
          };
          // services[serviceId].state = 'running';
          // fulfill to waiting consumers
          // proxRes(services[serviceId].service);
          return { service: serviceFunction, container };
        });
    };
    return tryStartService();
  },
};
