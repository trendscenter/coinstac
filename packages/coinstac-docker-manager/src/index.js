'use strict';

const Docker = require('dockerode');
const { promisify } = require('util');
const request = require('request-promise-native');
const portscanner = require('portscanner');

const setTimeoutPromise = promisify(setTimeout);

// TODO: ENV specific socket
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
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
    opts
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

const getAllImages = () => {
  return docker.listImages();
}

const startService = (serviceId, opts) => {
  const createService = () => {
    let proxRes;
    let proxRej;
    services[serviceId] = {};
    services[serviceId].state = 'starting';
    services[serviceId].service = new Promise((res, rej) => {
      proxRes = res;
      proxRej = rej;
    });
    return generateServicePort(serviceId)
    .then((port) => {
      const defaultOpts = {
        ExposedPorts: { '8881/tcp': {} },
        HostConfig: {
          PortBindings: { '8881/tcp': [{ HostPort: `${port}`, HostIp: '127.0.0.1' }] },
        },
        Tty: true,
      };

      // merge opts one level deep
      const memo = {};
      for (let [key] of Object.entries(defaultOpts)) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
        memo[key] = Object.assign(defaultOpts[key], opts[key] ? opts[key] : {});
      }

      const jobOpts = Object.assign(
        {},
        opts,
        memo
      );
      return docker.createContainer(jobOpts);
    })
    .then((container) => {
      services[serviceId].container = container;
      return container.start();
    })
    // timeout for server startup
    .then(() => setTimeoutPromise(5000))
    .then(() => {
      services[serviceId].service = (data) => {
        return request({
          url: `http://127.0.0.1:${services[serviceId].port}/run`,
          method: 'POST',
          json: true,
          body: { command: data },
        });
      };
      services[serviceId].state = 'running';
      // fulfill to waiting consumers
      proxRes(services[serviceId].service);
      return services[serviceId].service;
    })
    .catch((err) => {
      proxRej(err);
      throw err;
    });
  };

  if (services[serviceId]) {
    return Promise.resolve(services[serviceId].service);
  }

  return createService();
};

const pullImage = (computation) => {
  return new Promise((resolve, reject) => {
    docker.pull(computation, (err, stream) => {
      if (err) {
        reject(err);
      }
      resolve(stream);
    });
  });
};

const removeImage = (imageId) => {
  return docker.getImage(imageId).remove();
}
  
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
  getAllImages,
  pullImage,
  removeImage,
  queueJob,
  startService,
  stopAllServices,
  Docker,
};
