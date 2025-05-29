const Docker = require('dockerode');
const _ = require('lodash');
const http = require('http');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const utils = require('../utils');
const { ServiceFunctionGenerator } = require('./serviceFunction');

let docker;

function getDockerSocketPathConfig() {
  try {
    // Run the command to get the Docker endpoint
    const output = execSync('docker context ls --format "{{if eq .Current true}}{{.DockerEndpoint}}{{end}}"', { encoding: 'utf-8' });
    const dockerEndpoint = output.trim();
    if (dockerEndpoint.startsWith('unix://')) {
      // Unix socket path, typically on Linux, macOS, and WSL
      const socketPath = dockerEndpoint.replace('unix://', '');
      return { socketPath: socketPath };
    } else if (dockerEndpoint.startsWith('npipe://')) {
      // Named pipe path, typically on Windows
      return { socketPath: undefined, host: pipePath }
      ;
    } else {
      utils.logger.error('Unrecognized Docker endpoint format.');
      return null;
    }
  } catch (error) {
    utils.logger.error(`Error determining the Docker socket path: ${error.message}`);
    return null;
  }
}

// Usage
const pathConfig = getDockerSocketPathConfig();
utils.logger.info(`Current Docker socket/path: ${pathConfig}`);

if (pathConfig) {
  docker = new Docker(pathConfig);
} else {
  utils.logger.error('Could not determine the Docker socket or named pipe path. Falling back to default Dockerode configuration.');
  docker = new Docker();
}

const listImages = (opts, cb) => docker.listImages(opts, cb);
const ping = () => docker.ping();
const getImage = id => docker.getImage(id);
const pruneImages = () => {
  // TODO fix arguments to pruneImages
  return docker.pruneImages();
};
const pull = (id) => {
  if (process.platform === 'win32') {
    // NOTE: this uses a fixed api version, while this should be respected in docker
    // a better solution should be found
    const options = {
      socketPath: '//./pipe/docker_engine',
      path: `/v1.37/images/create?fromImage=${encodeURIComponent(id)}`,
      method: 'POST',
    };

    return new Promise((resolve) => {
      const callback = (res) => {
        res.setEncoding('utf8');
        resolve(res);
      };
      const clientRequest = http.request(options, callback);
      clientRequest.end();
    });
  }
  return docker.pull(id);
};

const pullImagesFromList = async (comps) => {
  const streams = await Promise.all(
    comps.map((image) => { return pull(`${image}:latest`); })
  );
  await pruneImages();
  return streams.map((stream, index) => ({ stream, compId: comps[index] }));
};

const listContainers = async (options = {}) => {
  const containers = await docker.listContainers(options);
  return containers.filter(container => container.Image.startsWith('coinstac'));
};

const getContainerLogs = async (containerId) => {
  const container = docker.getContainer(containerId);
  const containerInfo = await docker.getContainer(containerId).inspect();
  const imageInfo = await docker.getImage(containerInfo.Image).inspect();

  const logs = (await container.logs({
    follow: false,
    stdout: true,
    stderr: true,
    tail: 2,
  }))
    .toString()
    .split('\n')
    .map(elem => elem.replace(/[^\x20-\x7E]/g, '').trim())
    .filter(Boolean);

  return {
    imageName: imageInfo.RepoTags[0].split(':')[0],
    containerId: containerInfo.Id,
    logs,
  };
};

module.exports = {
  // id, port
  createService(serviceId, port, {
    version, mounts, dockerImage, containerOptions, ciDirectory,
  }) {
    const dockerOptions = {
      docker: _.merge({
        Image: dockerImage,
        HostConfig: {
          Binds: [...mounts],
          SecurityOpt: ['seccomp=unconfined'],
        },
      }, containerOptions),
    };
    /*
    In order for circle CI containers to see the mounts in the docker binds above
    the directory from which those mounts originate needs to be exposed as a volume
     */
    if (process.env.CI) {
      dockerOptions.docker.HostConfig = {
        Binds: [
          `${process.env.CI_VOLUME}:${ciDirectory}`,
        ],
        Volumes: {
          [ciDirectory]: {},
        },
        NetworkMode: process.env.CI_DOCKER_NETWORK,
      };
    }
    utils.logger.silly(`Request to start service ${serviceId}`);
    const compspecVersion = version || 1;
    // better way than global?
    if (process.LOGLEVEL) {
      switch (compspecVersion) {
        case 1:
          dockerOptions.docker.CMD = [
            'node',
            '/server/index.js',
            JSON.stringify({
              level: process.LOGLEVEL,
              server: 'ws',
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
          SecurityOpt: ['seccomp=unconfined'],
        },
        Tty: true,
      };

      const jobOpts = _.merge(
        dockerOptions.docker,
        defaultOpts,
        {}
      );

      return docker.createContainer(jobOpts)
        .then((container) => {
          utils.logger.silly(`Starting cointainer: ${serviceId}`);
          return container.start()
            .then(async container => ({ container, inspect: await container.inspect() }));
        })
        .then(({ container, inspect }) => {
          utils.logger.silly(`Cointainer started: ${serviceId}`);
          utils.logger.silly(`Returning service access function for ${serviceId}`);
          const host = process.env.CI ? inspect.Config.Hostname : '127.0.0.1';
          const serviceFunction = ServiceFunctionGenerator({ host, port, compspecVersion });

          return {
            service: serviceFunction,
            container,
          };
        });
    };
    return tryStartService();
  },
  docker,
  listImages,
  pruneImages,
  pullImagesFromList,
  ping,
  getImage,
  pull,
  getContainerStats: async () => {
    const containers = await docker.listContainers();
    const result = Promise.all(containers.map((container) => {
      return docker.getContainer(container.Id).stats({ id: container.Id, stream: false });
    }));
    return result;
  },
  listContainers,
  getContainerLogs,
};
