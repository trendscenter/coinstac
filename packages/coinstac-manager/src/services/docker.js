'use strict';

const Docker = require('dockerode');
const _ = require('lodash');
const request = require('request-stream');
const http = require('http');
const utils = require('../utils');
const { ServiceFunctionGenerator } = require('./serviceFunction');

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
          const serviceFunction = ServiceFunctionGenerator({ host, port, version });

          return {
            service: serviceFunction,
            container,
          };
        });
    };
    return tryStartService();
  },
  docker,
  listImages: (opts, cb) => docker.listImages(opts, cb),
  ping: () => docker.ping(),
  getImage: id => docker.getImage(id),
  pull: (id, cb) => {
    if (process.platform === 'win32') {
      // NOTE: this uses a fixed api version, while this should be respected in docker
      // a better solution should be found
      const options = {
        socketPath: '//./pipe/docker_engine',
        path: `/v1.37/images/create?fromImage=${encodeURIComponent(id)}`,
        method: 'POST',
      };

      const callback = (res) => {
        res.setEncoding('utf8');
        cb(null, res);
      };

      const clientRequest = http.request(options, callback);
      clientRequest.end();
    } else {
      return docker.pull(id, cb);
    }
  },
  getContainerStats: async () => {
    const containers = await docker.listContainers();
    const result = Promise.all(containers.map((container) => {
      return docker.getContainer(container.Id).stats({ id: container.id, stream: false });
    }));
    return result;
  },
};
