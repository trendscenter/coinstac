const Docker = require('dockerode');
const { reduce } = require('lodash');
const request = require('request-stream');
const portscanner = require('portscanner');
const http = require('http');
const Readable = require('stream').Readable;
const ss = require('socket.io-stream');
const socketIOClient = require('socket.io-client');

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

const generateServicePort = (serviceId) => {
  return portscanner.findAPortNotInUse(8100, 49151, '127.0.0.1')
  .then((newPort) => {
    services[serviceId].port = newPort;
    return newPort;
  });
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
  return true;
  // setInterval(() => {
  //   return docker.ping();
  // }, 1000);
};

/**
 * start or use an already started docker service based on serviceID
 * @param  {string} serviceId     unique ID to describe the service
 * @param  {string} serviceUserId unique user ID for use of this service
 * @param  {Object} opts          options for the service, { docker: {...} } opts are
 *                                  are passed directly to docker
 * @return {Promise}              promise that resolves to the service function
 */
const startService = (serviceId, serviceUserId, opts) => {
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
    let proxRej;
    services[serviceId] = { users: [serviceUserId] };
    services[serviceId].state = 'starting';
    services[serviceId].service = new Promise((res, rej) => {
      proxRes = res;
      proxRej = rej;
    });
    const tryStartService = () => {
      return generateServicePort(serviceId)
      .then((port) => {
        const defaultOpts = {
          // this port is coupled w/ the internal base server image FYI
          ExposedPorts: { '8881/tcp': {} },
          HostConfig: {
            PortBindings: { '8881/tcp': [{ HostPort: `${port}`, HostIp: '127.0.0.1' }] },
          },
          Tty: true,
        };

        // merge opts one level deep
        const memo = {};
        for (let [key] of Object.entries(defaultOpts)) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
          memo[key] = Object.assign(defaultOpts[key], opts.docker[key] ? opts.docker[key] : {});
        }

        const jobOpts = Object.assign(
          {},
          opts.docker,
          memo
        );
        return docker.createContainer(jobOpts);
      })
      .then((container) => {
        services[serviceId].container = container;
        return container.start();
      })
      // is the container service ready?
      .then(() => {
        const checkServicePort = () => {
          if (opts.http) {
            return new Promise((resolve, reject) => {
              const req = request(`http://127.0.0.1:${services[serviceId].port}/run`, { method: 'POST' }, (err, res) => {
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
        services[serviceId].service = (data) => {
          if (opts.http) {
            return new Promise((resolve, reject) => {
              const req = request(`http://127.0.0.1:${services[serviceId].port}/run`, { method: 'POST' }, (err, res) => {
                let buf = '';
                if (err) {
                  return reject(err);
                }
                // TODO: hey this is a stream, be cool to use that
                res.on('data', (chunk) => {
                  buf += chunk;
                });
                res.on('end', () => resolve(buf));
                res.on('error', e => reject(e));
              });
              req.write(JSON.stringify({
                command: data[0],
                args: data.slice(1, 2),
              }));
              req.end(data[2]);
            }).then((inData) => {
              let errMatch;
              let outMatch;
              let codeMatch;
              let endMatch;
              let errData = Buffer.alloc(0);
              let outData = Buffer.alloc(0);
              let code = Buffer.alloc(0);

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

              if (errData.length > 0) {
                throw new Error(`Computation failed with exitcode ${code.toString()}\n Error message:\n${errData.toString()}}`);
              }
              // NOTE: limited to sub 256mb
              let parsed;
              try {
                parsed = JSON.parse(outData.toString());
              } catch (e) {
                parsed = outData.toString();
              }
              return parsed;
            });
          }

          let proxR;
          let proxRj;
          const prox = new Promise((resolve, reject) => {
            proxR = resolve;
            proxRj = reject;
          });
          const socket = socketIOClient(`http://127.0.0.1:${services[serviceId].port}`);
          socket.on('connect', () => {
            const stream = ss.createStream();
            ss(socket).emit('run', stream, {
              control: {
                command: data[0],
                args: data.slice(1, 2),
              },
            });
            const dataStream = new Readable({ read() {
              this.push(data[2]);
              this.push(null);
            } });
            dataStream.pipe(stream);

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
            Promise.all([stdoutProm, stderrProm, endProm])
            .then((data) => {
              if (data[1] || data[2].code !== 0) {
                throw new Error(`Computation failed with exitcode ${data[2].code}\n Error message:\n${data[1]}}`);
              } else if (data[2].error) {
                throw new Error(`Computation failed to start\n Error message:\n${data[2].error}}`);
              }
              // NOTE: limited to sub 256mb
              let parsed;
              try {
                parsed = JSON.parse(data[0]);
              } catch (e) {
                parsed = data[0];
              }
              proxR(parsed);
            }).catch(error => proxRj(error));
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
        proxRej(err);
        throw err;
      });
    };
    return tryStartService();
  };

  if (services[serviceId] && (services[serviceId] !== 'shutting down')) {
    if (services[serviceId].users.indexOf(serviceUserId) === -1) {
      services[serviceId].users.push(serviceUserId);
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
        } else if (elem.RepoDigests) {
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
    return comps.map((val, index) =>
      ({
        stream: res[index],
        compId: val.compId,
        compName: val.compName,
      })
    );
  });
};

/**
 * Generate array of docker pull promises and wait until resolved to return merged output streams
 * @param {Object[]} comps array of computation id's to download
 * @return {Object} Returns array of objects containing stream and computation parameters
 */
const pullImagesFromList = comps =>
    Promise.all(comps.map(image => pullImage(`${image}:latest`)))
    .then(streams => streams.map((stream, index) => ({ stream, compId: comps[index] })));

/**
 * Remove the Docker image associated with the image id
 * @param {string} imgId ID of image to remove
 * @return {Promise}
 */
const removeImage = (imageId) => {
  return docker.getImage(imageId).remove();
};

/**
 * Attempts to stop a given service
 * If there are no other users, the service stops
 * Otherwise the user is removed from service usage
 *
 * @param  {String} serviceId     the service to stop
 * @param  {String} serviceUserId the user asking
 * @return {Promise}              A promise that resovles on success
 */
const stopService = (serviceId, serviceUserId) => {
  if (services[serviceId].users.indexOf(serviceUserId) > -1) {
    services[serviceId].users.splice(services[serviceId].users.indexOf(serviceUserId), 1);
  }
  if (services[serviceId].users.length === 0) {
    services[serviceId].state = 'shutting down';
    return services[serviceId].container.stop()
    .then(() => {
      delete services[serviceId];
    }).catch((err) => {
      // TODO: boxes don't always shutdown well, however that shouldn't crash a valid run
      // figure out a way to cleanup
      services[serviceId].state = 'zombie';
      services[serviceId].error = err;
    });
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
    .map(service => services[service].container.stop()))
    .then(() => {
      services = {};
    }
  );
};

module.exports = {
  getImages,
  getStatus,
  pullImages,
  pullImagesFromList,
  pruneImages,
  removeImage,
  queueJob,
  startService,
  stopService,
  stopAllServices,
  Docker,
};
