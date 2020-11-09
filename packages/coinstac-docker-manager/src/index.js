'use strict';

const Docker = require('dockerode');
const { reduce } = require('lodash');
const request = require('request-stream');
const portscanner = require('portscanner');
const http = require('http');
const winston = require('winston');
const WS = require('ws');
const _ = require('lodash');
const debug = require('debug');

let logger;
winston.loggers.add('docker-manager', {
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
logger = winston.loggers.get('docker-manager');
logger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';

const debugProfile = debug('pipeline:profile-manager');
debugProfile.log = l => logger.info(`PROFILING: ${l}`);

const setTimeoutPromise = (delay) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

// TODO: ENV specific socket
const docker = new Docker();
const streamPool = {};
const jobPool = {};
let services = {};
const portBlackList = new Set();
let portLock = false;

/**
 * Set an external logger instance
 * @param {Object} loggerInstance Winston logger
 */
const setLogger = (loggerInstance) => {
  logger = loggerInstance;
};

/**
 * Assigns a unique unsused port to be used for web traffic
 * @param  {string} serviceId Id to consume the port
 * @return {int}              open port assigned
 */
const generateServicePort = async (serviceId, start = 8101, thisLock = false) => {
  let newPort;
  if (portLock && !thisLock) {
    await setTimeoutPromise(Math.floor(Math.random() * 300));
    newPort = await generateServicePort(serviceId, newPort);
    return newPort;
  }
  portLock = true;
  newPort = await portscanner.findAPortNotInUse(start, 49151, '127.0.0.1');
  if (portBlackList.has(newPort)) {
    newPort = await generateServicePort(serviceId, newPort + 1, true);
    portBlackList.add(newPort);
    portLock = false;
    services[serviceId].port = newPort;
    return newPort;
  }
  portBlackList.add(newPort);
  portLock = false;
  services[serviceId].port = newPort;
  return newPort;
};

const manageStream = (stream, jobId) => {
  streamPool[jobId] = { stream, data: '', error: '' };

  let header = null;
  stream.on('readable', () => {
    // Demux streams, docker puts stdout/err together
    header = header || stream.read(8);
    while (header !== null) {
      const type = header.readUInt8(0);
      const payload = stream.read(header.readUInt32BE(4));
      if (payload === null) break;
      if (type === 2) {
        streamPool[jobId].error += payload;
      } else {
        streamPool[jobId].data += payload;
      }
      header = stream.read(8);
    }
  });

  return new Promise((resolve, reject) => {
    stream.on('end', () => {
      const container = jobPool[jobId];
      if (streamPool[jobId].error) {
        container.remove()
          .then(() => {
            jobPool[jobId] = undefined;
          });
        reject(streamPool[jobId].error);
        streamPool[jobId] = undefined;
      } else {
        resolve(streamPool[jobId].data);
        streamPool[jobId] = undefined;

        container.remove()
          .then(() => {
            jobPool[jobId] = undefined;
          });
      }
    });
    stream.on('error', (err) => {
      const container = jobPool[jobId];

      streamPool[jobId] = undefined;

      container.stop()
        .then(() => container.remove())
        .then(() => {
          jobPool[jobId] = undefined;
        });
      reject(err);
    });
  });
};

const queueJob = (jobId, input, opts) => {
  const jobOpts = Object.assign(
    {
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: input,
    },
    Object.assign({}, opts, opts.Image.includes(':') ? {} : { Image: `${opts.Image}:latest` })
  );
  return docker.createContainer(jobOpts).then((container) => {
    jobPool[jobId] = container;

    // Return a Promise that resolves when the container's data stream 2closes,
    // which should happen when the comp is done.
    const dataFinished = new Promise((resolve, reject) => {
      container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
        if (!err) {
          resolve(manageStream(stream, jobId));
        }

        reject(err);
      });
    });

    return container.start()
      .then(() => dataFinished);
  });
};

/**
 * Retrieve list of all local Docker images
 * @return {Object[]} Array of objects containing locally stored Docker images
 */
const getImages = () => {
  return docker.listImages();
};

/**
 * Retrieve Docker status
 * @return {boolean} is Docker running?
 */
const getStatus = () => {
  return docker.ping();
};

/**
 * start or use an already started docker service based on serviceId
 * @param  {string} serviceId     unique ID to describe the service
 * @param  {string} serviceUserId unique user ID for use of this service
 * @param  {Object} opts          options for the service, { docker: {...} } opts are
 *                                  are passed directly to docker
 * @return {Promise}              promise that resolves to the service function
 */
const startService = (serviceId, serviceUserId, opts) => {
  // debug timings
  let dockerPreCompStart;
  let dockerCompStart;
  let dockerPostCompStart;

  logger.silly(`Request to start service ${serviceId}`);
  let recurseLimit = 0;
  let serviceStartedRecurseLimit = 0;

  // better way than global?
  if (process.LOGLEVEL) {
    if (opts.docker.CMD) {
      opts.docker.CMD.push(process.LOGLEVEL);
    } else {
      opts.docker.CMD = ['node', '/server/index.js', JSON.stringify({ level: process.LOGLEVEL, server: opts.http ? 'http' : 'ws' })];
    }
  }
  const createService = () => {
    let proxRes;

    dockerPreCompStart = Date.now();
    services[serviceId] = {
      users:
      {
        [serviceUserId]: {
          debug: { dockerPreComp: 0, dockerComp: 0, dockerPostComp: 0 },
        },
      },
    };
    services[serviceId].state = 'starting';
    services[serviceId].service = new Promise((res) => {
      proxRes = res;
    });
    const tryStartService = () => {
      return generateServicePort(serviceId)
        .then((port) => {
          // port is initially set in generateServicePort, but really should be moved
          // here if that works (breaks tests?)
          services[serviceId].port = process.env.CI ? '8881' : port;
          logger.silly(`Starting service ${serviceId} at port: ${port}`);

          const PortBindings = process.env.CI ? {} : {
            '8881/tcp': [{ HostPort: `${port}`, HostIp: process.env.CI ? '' : '127.0.0.1' }],
            ...(process.LOGLEVEL === 'debug' && { '4444/tcp': [{ HostPort: '4444', HostIp: '127.0.0.1' }] }),
          };
          const defaultOpts = {
          // this port is coupled w/ the internal base server image FYI
            ExposedPorts: {
              '8881/tcp': {},
              ...(process.LOGLEVEL === 'debug' && { '4444/tcp': {} }),
            },
            HostConfig: {
              PortBindings,
            },
            Tty: true,
          };

          const jobOpts = _.merge(
            opts.docker,
            defaultOpts,
            {}
          );

          return docker.createContainer(jobOpts);
        })
        .then((container) => {
          logger.silly(`Starting cointainer: ${serviceId}`);
          services[serviceId].container = container;
          return container.start().then(c => c.inspect());
        })
        // is the container service ready?
        .then((container) => {
          services[serviceId].hostname = process.env.CI ? container.Config.Hostname : '127.0.0.1';
          logger.silly(`Cointainer started: ${serviceId}`);
          const checkServicePort = () => {
            if (opts.http) {
              return new Promise((resolve, reject) => {
                const req = request(`http://${services[serviceId].hostname}:${services[serviceId].port}/run`, { method: 'POST' }, (err, res) => {
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
                    return setTimeoutPromise(100)
                      .then(() => checkServicePort());
                  }
                  // met limit, fallback to timeout
                  logger.silly(`Container timeout for ${serviceId}`);
                  return setTimeoutPromise(5000);
                }
                // not a socket error, throw
                throw status;
              });
            }
            return Promise.resolve();
          };

          return checkServicePort();
        })
        .then(() => {
          logger.silly(`Returning service access funcion for ${serviceId}`);
          dockerCompStart = Date.now();
          const dockerPreComp = dockerCompStart - dockerPreCompStart;
          services[serviceId].users[serviceUserId].debug.dockerPreComp += dockerPreComp;
          debugProfile(`Manager initial startup for ${serviceUserId} computation took ${dockerPreComp}ms`);
          services[serviceId].service = (data, serviceUserId) => {
            dockerPreCompStart = Date.now();
            let proxR;
            let proxRj;
            const prox = new Promise((resolve, reject) => {
              proxR = resolve;
              proxRj = reject;
            });
            new Promise((resolve) => {
              let count = 0;
              const testConnection = () => {
                const ws = new WS(`ws://${services[serviceId].hostname}:${services[serviceId].port}`);
                ws.on('open', () => {
                  ws.close(1000, 'Test Connection');
                  resolve();
                });
                ws.on('error', (e) => {
                  if (e.code && (e.code === 'ECONNRESET' || e.code === 'ECONNREFUSED')) {
                    ws.terminate();
                    if (count > 10) {
                      proxRj(new Error('Docker ws server timeout exceeded'));
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
              dockerCompStart = Date.now();
              const dockerPreComp = dockerCompStart - dockerPreCompStart;
              services[serviceId].users[serviceUserId].debug.dockerPreComp += dockerPreComp;
              debugProfile(`Manger before computation took ${serviceUserId} ${dockerPreComp}ms`);
              const ws = new WS(`ws://${services[serviceId].hostname}:${services[serviceId].port}`);
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
                let first = true;
                ws.on('message', (data) => {
                  if (first) {
                    dockerPostCompStart = Date.now();
                    first = false;
                  }

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
                const dockerComp = dockerPostCompStart - dockerCompStart;
                services[serviceId].users[serviceUserId].debug.dockerComp += dockerComp;
                debugProfile(`Manager computation took ${serviceUserId} ${dockerComp}ms`);
                logger.debug('Manager container closed');
                if (output.code !== 0) {
                  throw new Error(`Computation failed with exitcode ${output.code} and stderr ${output.stderr}`);
                }
                logger.silly(`Docker stderr: ${output.stderr}`);
                logger.debug(`Output size: ${output.stdout.length}`);

                let error;
                try {
                  const parsed = JSON.parse(output.stdout);
                  const dockerPostComp = Date.now() - dockerPostCompStart;
                  services[serviceId].users[serviceUserId].debug.dockerPostComp += dockerPostComp;
                  debugProfile(`Manager parsing output took ${serviceUserId} ${dockerPostComp}ms`);
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
          services[serviceId].state = 'running';
          // fulfill to waiting consumers
          proxRes(services[serviceId].service);
          return services[serviceId].service;
        })
        .catch((err) => {
          if (err.statusCode === 500 && err.message.includes('port is already allocated') && recurseLimit < 500) {
            recurseLimit += 1;
            // this problem mostly occurs when started several boxes quickly
            // add some delay to give them breathing room to setup ports
            return setTimeoutPromise(200)
              .then(() => tryStartService());
          }

          throw err;
        });
    };
    return tryStartService();
  };

  if (services[serviceId] && (services[serviceId].state !== 'shutting down' && services[serviceId].state !== 'zombie')) {
    if (!services[serviceId].users[serviceUserId]) {
      services[serviceId].users[serviceUserId] = {
        debug: { dockerPreComp: 0, dockerComp: 0, dockerPostComp: 0 },
      };
    }
    if (services[serviceId].container && services[serviceId].state !== 'starting') {
      logger.silly('Returning already started service');
      return new Promise((resolve, reject) => {
        services[serviceId].container.inspect((error, data) => {
          if (error) {
            reject(error);
          }
          if (data.State.Running === true) {
            return resolve(services[serviceId].service);
          }
          // the service was somehow shutdown or crashed, make a new one
          logger.silly('Service was down, starting new instance');
          resolve(createService());
        });
      });
    }
    return Promise.resolve(services[serviceId].service);
  }
  return createService();
};

/**
* Finds dangling coinstac images and deletes them
* @return {Promise} list of deleted images and tags
*/
const pruneImages = () => {
  return new Promise((resolve, reject) => {
    docker.listImages({ filters: { dangling: { true: true } } }, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res.filter(((elem) => {
        // TODO: find better way, make docker api 'reference' work?
        if (elem.RepoTags) {
          return elem.RepoTags[0].includes('coinstac');
        } if (elem.RepoDigests) {
          return elem.RepoDigests[0].includes('coinstac');
        }
        return false;
      })));
    });
  }).then((images) => {
    return Promise.all(images.map((image) => {
      return new Promise((resolve) => {
        docker.getImage(image.Id).remove({ force: { true: 'true' } }, (err, res) => {
          if (err) {
            // remove can fail for serveral benign reasons, just resolve with the reason
            resolve(err);
          }
          resolve(res);
        });
      });
    }));
  });
};

/**
 * Pull individual image from Docker hub
 * @param {String} computation Docker image name
 * @return {Object} Returns stream of docker pull output
 */
const pullImage = (computation) => {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // NOTE: this uses a fixed api version, while this should be respected in docker
      // a better solution should be found
      const options = {
        socketPath: '//./pipe/docker_engine',
        path: `/v1.37/images/create?fromImage=${encodeURIComponent(computation)}`,
        method: 'POST',
      };

      const callback = (res) => {
        res.setEncoding('utf8');
        resolve(res);
      };

      const clientRequest = http.request(options, callback);
      clientRequest.end();
    } else {
      docker.pull(computation, (err, stream) => {
        if (err) {
          reject(err);
        }
        resolve(stream);
      });
    }
  });
};

/**
 * Generate array of docker pull promises and wait until resolved to return merged output streams
 * TODO: this function should be depricated for pullImagesFromList,
 *  as it couples too closely w/ the UI
 * @param {Object[]} comps array of computation objects to download
 * @param {String} comps.img Docker image name
 * @param {String} comp.compId Computation ID from app DB
 * @param {String} comp.compName Computation name from DB
 * @return {Object} Returns array of objects containing stream and computation parameters
 */
const pullImages = (comps) => {
  const compsP = reduce(comps, (arr, comp) => {
    arr.push(pullImage(`${comp.img}:latest`));
    return arr;
  }, []);

  // Set promise catches to undefined so that failures can be handled as successes: https://davidwalsh.name/promises-results
  return Promise.all(compsP.map(prom => prom.catch(err => err)))
    .then((res) => {
      return comps.map((val, index) => ({
        stream: res[index],
        compId: val.compId,
        compName: val.compName,
      }));
    });
};

/**
 * Generate array of docker pull promises and wait until resolved to return merged output streams
 * @param {Object[]} comps array of computation id's to download
 * @return {Object} Returns array of objects containing stream and computation parameters
 */
const pullImagesFromList = comps => Promise.all(comps.map(image => pullImage(`${image}:latest`)))
  .then(streams => streams.map((stream, index) => ({ stream, compId: comps[index] })));

/**
 * Remove the Docker image associated with the image id
 * @param {string} imgId ID of image to remove
 * @return {Promise}
 */
const removeImage = (imageId) => {
  return docker.getImage(imageId).remove();
};

const removeImagesFromList = comps => Promise.all(comps.map(image => removeImage(`${image}:latest`)))
  .then(streams => streams.map((stream, index) => ({ stream, compId: comps[index] })));

/**
 * Attempts to stop a given service
 * If there are no other users, the service stops
 * Otherwise the user is removed from service usage
 *
 * @param  {String} serviceId     the service to stop
 * @param  {String} serviceUserId the user asking
 * @return {Promise}              A promise that resovles on success
 */
const stopService = (serviceId, serviceUserId, waitForBox) => {
  const service = services[serviceId];
  if (!service) return Promise.resolve();
  if (service.users[serviceUserId]) {
    debugProfile('**************************** Manager summary ***************************');
    Object.keys(service.users[serviceUserId].debug).forEach((timing) => {
      debugProfile(`Total time for ${serviceUserId} manager task ${timing} took ${service.users[serviceUserId].debug[timing]}ms`);
    });
    delete service.users[serviceUserId];
  }
  if (Object.keys(service.users).length === 0) {
    if (service.state !== 'starting') {
      service.state = 'shutting down';
      const boxPromise = service.container.stop()
        .then(() => {
          portBlackList.delete(service[serviceId].port);
          delete services[serviceId];
        }).catch((err) => {
        // TODO: boxes don't always shutdown well, however that shouldn't crash a valid run
        // figure out a way to cleanup
          service.state = 'zombie';
          service.error = err;
        });
      return waitForBox ? boxPromise : Promise.resolve();
    }
    delete services[serviceId];
    return Promise.resolve();
  }
  return Promise.resolve();
};

/**
 * Stops all currently running containers
 * @return {Promise} resolved when all services are stopped
 */
const stopAllServices = () => {
  return Promise.all(
    Object.keys(services)
      .map(service => services[service].container.stop())
  )
    .then(() => {
      services = {};
    });
};

module.exports = {
  getImages,
  getStatus,
  pullImages,
  pullImagesFromList,
  pruneImages,
  removeImage,
  removeImagesFromList,
  queueJob,
  setLogger,
  startService,
  stopService,
  stopAllServices,
  Docker,
};
