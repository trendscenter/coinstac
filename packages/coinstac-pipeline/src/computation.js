'use strict';

const _ = require('lodash');

module.exports = {
  create(spec, mode, runId, clientId, docker) {
    const computation = Object.assign(
      {},
      spec.computation,
      mode === 'remote' ? spec.computation.remote : {}
    );
    const { meta } = spec;
    const dockerOptions = mode === 'remote'
      ? (spec.computation.remote.dockerOptions || {}) : (spec.computation.dockerOptions || {});
    return {
      computation,
      meta,
      mode,
      runId,
      clientId,
      start(input, { operatingDirectory }) {
        // console.log(input); Keeping this for future ref.
        let HostConfig = {
          Binds:
          [
            `${operatingDirectory}/input:/input:ro`,
            `${operatingDirectory}/output:/output:rw`,
            `${operatingDirectory}/cache:/cache:rw`,
            `${operatingDirectory}/transfer:/transfer:rw`,
          ],
        };
        if (process.env.CI) {
          HostConfig = {
            Binds: [
              `${process.env.CI_VOLUME}:${operatingDirectory}`,
            ],
            Volumes: {
              [operatingDirectory]: {},
            },
            NetworkMode: process.env.CI_DOCKER_NETWORK,
          };
        }
        return docker.startService(
          this.meta.id,
          `${this.runId}-${this.clientId}`,
          {
            docker: _.merge({
              Image: computation.dockerImage,
              HostConfig,
            }, dockerOptions),
          }
        )
          .then((service) => {
            return service(computation.command.concat([`${JSON.stringify(input)}`]), `${this.runId}-${this.clientId}`);
          });
      },
      stop() {
        return docker.stopService(this.meta.id, `${this.runId}-${this.clientId}`, true);
      },
    };
  },
};
