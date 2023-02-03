'use strict';

const Docker = require('dockerode');
const _ = require('lodash');
const http = require('http');
const utils = require('../utils');
const { ServiceFunctionGenerator } = require('./serviceFunction');

const docker = new Docker();
const listImages = (opts, cb) => docker.listImages(opts, cb);
const ping = () => docker.ping()
const getImage = id => docker.getImage(id)
const pruneImages = () => {
  return docker.pruneImages({filters: {label: {repository: 'coinstacteam' }}});
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

    return new Promise((resolve, reject)=>{
      const callback = (res) => {
          res.setEncoding('utf8');
          resolve(res);
        }
      const clientRequest = http.request(options, callback);
      clientRequest.end();
    })
  } else {
    return docker.pull(id);
  }
}

const pullImagesFromList = async (comps) => {
  const streams = await Promise.all(
    comps.map((image) => {return pull(`${image}:latest`)})
  )
  await pruneImages()
  return streams.map((stream, index) => ({ stream, compId: comps[index] }))
}

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
      return docker.getContainer(container.Id).stats({ id: container.id, stream: false });
    }));
    return result;
  },
};
