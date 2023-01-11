'use strict';

const containerManager = require('coinstac-container-manager');

module.exports = {
  /**
   * Creates a computation object for a given compspec
   * @param  {Object} spec     a compspec to use
   * @param  {Object} mode     remote or local modes
   * @param  {Object} runId    current run
   * @param  {Object} clientId current client id
   * @return {Object}          a computation
   */
  create({
    alternateInputDirectory,
    clientId,
    mode,
    runId,
    spec,
  }) {
    const computation = Object.assign(
      {},
      spec.computation,
      mode === 'remote' ? spec.computation.remote : {}
    );
    const { meta } = spec;
    let containerOptions = {};
    if (mode === 'remote') {
      if (spec.computation.remote) {
        containerOptions = spec.computation.remote.containerOptions || {};
      }
    } else {
      containerOptions = spec.computation.containerOptions || {};
    }
    return {
      computation,
      meta,
      mode,
      runId,
      clientId,
      /**
       * starts a run on the computation
       * @param  {Object} input         input passed to the manager
       * @param  {String} operatingDirectory the base directory
       * @return {Promise}               Promise that resolves or rejects to output
       */
      start(input, { operatingDirectory }) {
        // console.log(input); Keeping this for future ref.
        const opts = {};
        opts.version = meta.compspecVersion || 1;
        opts.mounts = [
          `${operatingDirectory}/input:/input:ro`,
          `${operatingDirectory}/output:/output:rw`,
          `${operatingDirectory}/transfer:/transfer:rw`,
        ];
        opts.dockerImage = computation.dockerImage;
        opts.containerOptions = containerOptions;
        opts.ciDirectory = operatingDirectory;
        if (alternateInputDirectory) opts.mounts.push(`${alternateInputDirectory.in}:${alternateInputDirectory.out}:ro`);

        return containerManager.startService(
          {
            serviceId: `${this.runId}-${this.clientId}`,
            serviceUserId: `${this.runId}-${this.clientId}`,
            serviceType: computation.type,
            opts,
          }
        )
          .then((service) => {
            return service({ input, mode, command: computation.command });
          });
      },
      /**
       * Stops a computation if currently started
       * @return {Promise}   resolves on stop
       */
      stop() {
        return containerManager.stopService(`${this.runId}-${this.clientId}`, `${this.runId}-${this.clientId}`, true);
      },
    };
  },
};
