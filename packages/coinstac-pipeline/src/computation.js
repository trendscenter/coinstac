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
      start(input, { baseDirectory }) {
        // console.log(input); Keeping this for future ref.
        return docker.startService(
          this.meta.id,
          `${this.runId}-${this.clientId}`,
          {
            docker: _.merge({
              Image: computation.dockerImage,
              HostConfig: {
                Binds: [
                  `${baseDirectory}/input:/input:ro`,
                  `${baseDirectory}/output:/output:rw`,
                  `${baseDirectory}/cache:/cache:rw`,
                  `${baseDirectory}/transfer:/transfer:rw`,
                ],
              },
            }, dockerOptions),
          }
        )
          .then((service) => {
            return service(computation.command.concat([`${JSON.stringify(input)}`]));
          });
      },
      stop() {
        return docker.stopService(this.meta.id, `${this.runId}-${this.clientId}`, true);
      },
    };
  },
};
