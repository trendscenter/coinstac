'use strict';

const Docker = require('dockerode');
const _ = require('lodash');
const request = require('request-stream');
const WS = require('ws');
const utils = require('../utils');

const docker = new Docker();

module.exports = {
  // id, port
  createService(serviceId, port, opts) {
    utils.logger.silly(`Request to start service ${serviceId}`);
    let serviceStartedRecurseLimit = 0;
    const version = opts.version || 1;
    // better way than global?
    if (process.LOGLEVEL) {
      if (opts.docker.CMD) {
        opts.docker.CMD.push(process.LOGLEVEL);
      } else {
        switch (version) {
          case 1:
            opts.docker.CMD = [
              'node',
              '/server/index.js',
              JSON.stringify({
                level: process.LOGLEVEL,
                server: opts.http ? 'http' : 'ws',
                port: process.env.CI ? port : 8881,
              }),
            ];
            break;
          case 2:
            break;
          default:
            throw new Error('Invalid compspecVersion');
        }
      }
    }

    const tryStartService = () => {
      utils.logger.silly(`Starting service ${serviceId} at port: ${port}`);
      // for debug mode just grab the last port # to try to not have containers collide
      const portmunge = port.toString().slice(-2);
      if (process.LOGLEVEL === 'debug') utils.logger.debug(`Container debug port at: 44${portmunge}`);
      const tcpOpt = `${process.env.CI ? port : 8881}/tcp`;
      const defaultOpts = {
      // this port is coupled w/ the internal base server image FYI
        ExposedPorts: {
          [tcpOpt]: {},
          ...(process.LOGLEVEL === 'debug' && { '4444/tcp': {} }),
        },
        HostConfig: {
          PortBindings: {
            [tcpOpt]: [{ HostPort: `${port}`, HostIp: process.env.CI ? '' : '127.0.0.1' }],
            ...(process.LOGLEVEL === 'debug' && { '4444/tcp': [{ HostPort: `44${portmunge}`, HostIp: '127.0.0.1' }] }),
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
          utils.logger.silly(`Starting cointainer: ${serviceId}`);
          return container.start()
            .then(async container => ({ container, inspect: await container.inspect() }));
        })
        // is the container service ready?
        .then(({ container, inspect }) => {
          const host = process.env.CI ? inspect.Config.Hostname : '127.0.0.1';
          utils.logger.silly(`Cointainer started: ${serviceId}`);
          const checkServicePort = () => {
            if (opts.http) {
              return new Promise((resolve, reject) => {
                const req = request(`http://${host}:${port}/run`, { method: 'POST' }, (err, res) => {
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
                  utils.logger.silly(`Container timeout for ${serviceId}`);
                  return utils.setTimeoutPromise(5000);
                }
                // not a socket error, throw
                throw status;
              });
            }
            return Promise.resolve();
          };

          return checkServicePort().then(() => ({ container, inspect }));
        })
        .then(({ container, inspect }) => {
          utils.logger.silly(`Returning service access function for ${serviceId}`);
          const host = process.env.CI ? inspect.Config.Hostname : '127.0.0.1';
          /**
           * Calls the WS server inside the container
           * with data format:
           * [{command}, {args}, {inputData}]
           * @param  {Array} data  service data to run
           * @return {Promise}     resolves or rejects from service run
           */
          const serviceFunction = (data, mode, command) => {
            let proxR;
            let proxRj;
            const prox = new Promise((resolve, reject) => {
              proxR = resolve;
              proxRj = reject;
            });
            switch (version) {
              case 1: {
                const commandData = command.concat([`${JSON.stringify(data)}`]);
                new Promise((resolve) => {
                  let count = 0;
                  const testConnection = () => {
                    const ws = new WS(`ws://${host}:${port}`);
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
                  const ws = new WS(`ws://${host}:${port}`);
                  ws.on('open', () => {
                    ws.send(JSON.stringify({
                      command: commandData[0],
                      args: commandData.slice(1, -1),
                    }));
                    utils.logger.debug(`Input data size: ${commandData.slice(-1)[0].length}`);
                    ws.send(commandData.slice(-1)[0]);
                    ws.send(null);
                  });
                  ws.on('close', (code, reason) => {
                    if (code !== 1000) proxRj(new Error(`Abnormal Docker websocket close: ${reason}`));
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
                    utils.logger.debug('Docker service call finished');
                    if (output.code !== 0) {
                      throw new Error(`Computation failed with exitcode ${output.code} and stderr ${output.stderr}`);
                    }
                    utils.logger.debug(`Output size: ${output.stdout.length}`);

                    let error;
                    try {
                      const parsed = JSON.parse(output.stdout);
                      proxR(parsed);
                    } catch (e) {
                      error = e;
                      utils.logger.error(`Computation output serialization failed with value: ${JSON.stringify(output)}`);
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

                break;
              }
              case 2:
                new Promise((resolve) => {
                  let count = 0;
                  const testConnection = () => {
                    const ws = new WS(`ws://${host}:${port}`);
                    ws.on('open', () => {
                      // ws.close(1000, 'Test Connection');
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
                  const ws = new WS(`ws://${host}:${port}`);
                  ws.on('open', () => {
                    ws.send(JSON.stringify({
                      mode,
                      data,
                    }));
                  });
                  ws.on('error', (e) => {
                    proxRj(e);
                  });
                  ws.on('close', (code, reason) => {
                    if (code !== 1000) proxRj(new Error(`Abnormal Docker websocket close: ${reason}`));
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
                          if (res.code !== undefined && errfin) {
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
                          stdout = res.data || '';
                          if (outfin) {
                            ws.close(1000, 'Normal Client disconnect');
                            resolve({
                              code: 0,
                              stdout,
                              stderr: '',
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
                    utils.logger.debug('Docker service call finished');
                    if (output.code !== 0) {
                      throw new Error(`Computation failed with exitcode ${output.code} and stderr ${output.stderr}`);
                    }
                    proxR(output.stdout);
                  }).catch((e) => {
                    proxRj(e);
                  });
                });
                break;
              default:
                proxRj(new Error('Invalid compspecVersion'));
            }
            // promise fullfilled by container output
            return prox;
          };

          return { service: serviceFunction, container };
        });
    };
    return tryStartService();
  },
  docker,
  listImages: (opts, cb) => docker.listImages(opts, cb),
  ping: () => docker.ping(),
  getImage: id => docker.getImage(id),
  pull: (id, cb) => docker.pull(id, cb),
};
