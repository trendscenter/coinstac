'use strict';

const fs = require('fs');

const fileMessage = 'a'.repeat(9000);
const dataMessage = 'b'.repeat(9000);

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
        const localData = {
          output: {
            hasha: dataMessage,
          },
        };

        const remoteData = {
          output: {
            hasha: dataMessage,
          },
          success: false,
        };

        const fileData = fileMessage;

        return new Promise((resolve, reject) => {
          fs.writeFile('/home/rochaeb/Documents/Projects/coinstac/packages/coinstac-images/coinstac-file-transfer-test/test/transfer/local0/simulatorRun/a.txt', fileData, (err) => {
            if (err) {
              return reject(err);
            }

            resolve(mode === 'remote' ? remoteData : localData);
          });
        });
        // console.log(input); Keeping this for future ref.
        // return docker.startService(
        //   this.meta.id,
        //   `${this.runId}-${this.clientId}`,
        //   {
        //     docker: {
        //       Image: computation.dockerImage,
        //       HostConfig: {
        //         Binds: [
        //           `${baseDirectory}/input:/input:ro`,
        //           `${baseDirectory}/output:/output:rw`,
        //           `${baseDirectory}/cache:/cache:rw`,
        //           `${baseDirectory}/transfer:/transfer:rw`,
        //         ],
        //       },
        //     },
        //   }
        // )
        //   .then((service) => {
        //     return service(computation.command.concat([`${JSON.stringify(input)}`]))
        //       .catch((error) => {
        //         // decorate w/ input
        //         error.input = input;
        //         throw error;
        //       })
        //       .then((data) => {
        //         if (typeof data === 'string') {
        //           const err = new Error(`Computation output serialization failed with value: ${data}`);
        //           err.input = input;
        //           throw err;
        //         }
        //         return data;
        //       });
        //   });
      },
      stop() {
        // return docker.stopService(this.meta.id, `${this.runId}-${this.clientId}`, true);
        return Promise.resolve();
      },
    };
  },
};
