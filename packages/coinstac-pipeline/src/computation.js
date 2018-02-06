'use strict';

const docker = require('coinstac-docker-manager');

module.exports = {
  create(spec, mode, runId) {
    const computation = Object.assign(
      {},
      spec.computation,
      mode === 'remote' ? spec.computation.remote : {}
    );
    const meta = spec.meta;

    return {
      computation,
      meta,
      mode,
      runId,
      start(input, { baseDirectory }) {
        return docker.startService(
          this.meta.id,
          this.runId,
          {
            Image: computation.dockerImage,
            HostConfig: {
              Binds: [
                `${baseDirectory}:/input:ro`,
                `${baseDirectory}/output:/output:rw`,
                `${baseDirectory}/cache:/cache:rw`,
              ],
            },
          }
        )
        .then((service) => {
          return service(computation.command.concat([`${JSON.stringify(input)}`]));
        });
      },
      stop() {
        return docker.stopService(this.meta.id, this.runId);
      },
    };
  },
};
