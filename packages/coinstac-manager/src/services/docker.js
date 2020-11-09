'use strict';

const Docker = require('dockerode');
const _ = require('lodash');
const request = require('request-stream');
const WS = require('ws');
const utils = require('../utils');

const docker = new Docker();
const { logger } = utils;

module.exports = {
  // id, port
  createService(serviceId, port, opts) {
    logger.silly(`Request to start service ${serviceId}`);
    let serviceStartedRecurseLimit = 0;
    // better way than global?
    if (process.LOGLEVEL) {
      if (opts.docker.CMD) {
        opts.docker.CMD.push(process.LOGLEVEL);
      } else {
        opts.docker.CMD = ['node', '/server/index.js', JSON.stringify({ level: process.LOGLEVEL, server: opts.http ? 'http' : 'ws' })];
      }
    }

    const tryStartService = () => {
      logger.silly(`Starting service ${serviceId} at port: ${port}`);
      const defaultOpts = {
      // this port is coupled w/ the internal base server image FYI
        ExposedPorts: {
          '8881/tcp': {},
          ...(process.LOGLEVEL === 'debug' && { '4444/tcp': {} }),
        },
        HostConfig: {
          PortBindings: {
            '8881/tcp': [{ HostPort: `${port}`, HostIp: '127.0.0.1' }],
            ...(process.LOGLEVEL === 'debug' && { '4444/tcp': [{ HostPort: '4444', HostIp: '127.0.0.1' }] }),
          },
        },
        Tty: true,
      };

      const jobOpts = _.merge(
        opts.docker,
        defaultOpts,
        {}
      );

      return docker.createContainer(jobOpts)
        .then((container) => {
          logger.silly(`Starting cointainer: ${serviceId}`);
          return container.start().then(() => container);
        })
        // is the container service ready?
        .then((container) => {
          logger.silly(`Cointainer started: ${serviceId}`);
          const checkServicePort = () => {
            if (opts.http) {
              return new Promise((resolve, reject) => {
                const req = request(`http://127.0.0.1:${port}/run`, { method: 'POST' }, (err, res) => {
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

                const control = {
                  command: 'echo',
                  args: ['test'],
                };
                req.end(JSON.stringify(control));
              }).catch((status) => {
                if (status.message === 'socket hang up' || status.message === 'read ECONNRESET') {
                  serviceStartedRecurseLimit += 1;
                  if (serviceStartedRecurseLimit < 500) {
                    return utils.setTimeoutPromise(100)
                      .then(() => checkServicePort());
                  }
                  // met limit, fallback to timeout
                  logger.silly(`Container timeout for ${serviceId}`);
                  return utils.setTimeoutPromise(5000);
                }
                // not a socket error, throw
                throw status;
              });
            }
            return Promise.resolve();
          };

          return checkServicePort().then(() => container);
        })
        .then((container) => {
          logger.silly(`Returning service access function for ${serviceId}`);
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
                      proxRj(new Error('Docker websocket server timeout exceeded'));
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
                logger.debug(`Input data size: ${data[2].length}`);
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
                logger.debug('Docker service call finished');
                if (output.code !== 0) {
                  throw new Error(`Computation failed with exitcode ${output.code} and stderr ${output.stderr}`);
                }
                logger.silly(`Docker stderr: ${output.stderr}`);
                logger.debug(`Output size: ${output.stdout.length}`);

                let error;
                try {
                  const parsed = JSON.parse(output.stdout);
                  proxR(parsed);
                } catch (e) {
                  error = e;
                  logger.error(`Computation output serialization failed with value: ${output.stdout}`);
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
