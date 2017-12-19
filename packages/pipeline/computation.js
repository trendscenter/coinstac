'use strict';

const docker = require('../coinstac-docker-manager/src/index');

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
      start(input) {
        return docker.startService(meta.id, { Image: computation.dockerImage })
        .then((service) => {
          console.log(`${mode} RUN`);
          return service(computation.command.concat([`${JSON.stringify(input)}`]));
        });
      },
      // TODO: done() for removing services
    };
  },
};
