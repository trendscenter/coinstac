'use strict';

const _ = require('lodash');
const Manager = require('coinstac-docker-manager');
const path = require('path');

/**
 * Generates manager options per computation type
 * @param  {Object} computation      a computation spec
 * @param  {Object} baseDirectory    base directory reference for options
 * @param  {Object} containerOptions overide or complementary options from the spec
 * @return {Object}                  options
 */
const managerOptions = ({
  computation,
  baseDirectory,
  containerOptions,
  imageDirectory,
}) => {
  let opts;
  switch (computation.type) {
    case 'docker':
      opts = {
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
        }, containerOptions),
      };
      break;
    case 'singularity':
      opts = [
        // '--contain', // not yet working on osx
        '-B',
        `${baseDirectory}/input:/input:ro,${baseDirectory}/output:/output:rw,${baseDirectory}/cache:/cache:rw,${baseDirectory}/transfer:/transfer:rw`,
        path.join(imageDirectory, computation.image),
      ];
      break;
    default:
      throw new Error('Invalid computation type');
  }
  return opts;
};

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
    clientId,
    imageDirectory,
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
    const containerOptions = mode === 'remote'
      ? (spec.computation.remote.containerOptions || {})
      : (spec.computation.containerOptions || {});
    return {
      computation,
      meta,
      mode,
      runId,
      clientId,
      /**
       * starts a run on the computation
       * @param  {Object} input         input passed to the manager
       * @param  {String} baseDirectory the base directory
       * @return {Promise}               Promise that resolves or rejects to output
       */
      start(input, { baseDirectory }) {
        // console.log(input); Keeping this for future ref.
        const opts = managerOptions({
          computation,
          baseDirectory,
          containerOptions,
          imageDirectory,
        });
        return Manager.startService(
          this.meta.id,
          `${this.runId}-${this.clientId}`,
          computation.type,
          opts
        )
          .then((service) => {
            return service(computation.command.concat([`${JSON.stringify(input)}`]));
          });
      },
      /**
       * Stops a computation if currently started
       * @return {Promise}   resolves on stop
       */
      stop() {
        return Manager.stopService(this.meta.id, `${this.runId}-${this.clientId}`, true);
      },
    };
  },
};
