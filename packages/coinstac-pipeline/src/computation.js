'use strict';

module.exports = {
  create(spec, mode, runId, clientId, docker) {
    const computation = Object.assign(
      {},
      spec.computation,
      mode === 'remote' ? spec.computation.remote : {}
    );
    const { meta } = spec;

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
            docker: {
              Image: computation.dockerImage,
              HostConfig: {
                Binds: [
                  `${baseDirectory}/input:/input:ro`,
                  `${baseDirectory}/output:/output:rw`,
                  `${baseDirectory}/cache:/cache:rw`,
                  `${baseDirectory}/transfer:/transfer:rw`,
                ],
              },
            },
          }
        )
          .then((service) => {
            return service(computation.command.concat([`${JSON.stringify(input)}`]))
              .catch((error) => {
                // decorate w/ input
                error.input = input;
                throw error;
              })
              .then((data) => {
                if (typeof data === 'string') {
                  const err = new Error(`Computation output serialization failed with value: ${data}`);
                  err.input = input;
                  throw err;
                }
                return data;
              });
          });
      },
      stop() {
        return docker.stopService(this.meta.id, `${this.runId}-${this.clientId}`, true);
      },
    };
  },
};
