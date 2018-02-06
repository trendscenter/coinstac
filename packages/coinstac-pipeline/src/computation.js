'use strict';

const docker = require('coinstac-docker-manager');

module.exports = {
  create(spec, mode) {
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
      start(input, { baseDirectory }) {
        return docker.startService(
          meta.id,
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
      // TODO: done() for removing services
    };
  },
};
