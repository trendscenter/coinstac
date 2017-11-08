'use strict';

const docker = require('../coinstac-docker-manager/src/index');

module.exports = {
  create(spec) {
    const computation = spec.computation;
    const meta = spec.meta;

    return {
      meta,
      computation,
      start(input) {
        return docker.startService(meta.id, { Image: computation.dockerImage })
        .then((service) => {
          return service(computation.command.concat([`${JSON.stringify(input)}`]));
        });
      },
      // TODO: done() for removing services
    };
  },
};
