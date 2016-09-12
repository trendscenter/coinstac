'use strict';

/**
* @module service/computation-registry
*/

const coinstacCommon = require('coinstac-common');
const os = require('os');
const mkdirp = require('mkdirp');
const path = require('path');
const pify = require('pify');

const logger = require('./logger');

/**
 * @property instance ComputationRegistry instance
 */
module.exports = {
  instance: null,

  /**
   * get ComputationRegistry instance
   * @returns {ComputationRegistry}
   */
  get() {
    /* istanbul ignore next */
    if (!this.instance) {
      throw new Error('computationRegistry must be configured before retrieval');
    }
    return this.instance;
  },

  /**
   * get computations path.
   * @returns {string} path where computations are stored
   */
  getComputationsPath() {
    return path.join(
      os.tmpdir(),
      'coinstac-server-core',
      'computations'
    );
  },

  /**
   * initialize the server ComputationRegistry
   * {@link http://mrn-code.github.io/coinstac-common/ComputationRegistry.html ComputationRegistry}
   * @returns {Promise}
   */
  init() {
    logger.info('Initializing computation registry');

    return this.upsertComputationsDir()
      .then(() => coinstacCommon.services.computationRegistry({
        path: this.getComputationsPath(),
      }))
      .then(reg => {
        this.instance = reg;
        logger.info('Computation registry set up');
        return this.get();
      });
  },

  /**
   * upsert computations dir.
   * @returns {Promise} resolves with computations dir
   */
  upsertComputationsDir() {
    return pify(mkdirp)(this.getComputationsPath());
  },

  /**
   * removes singleton registry instance.  old instances is garbage
   * collected
   * @returns {undefined}
   */
  teardown() {
    delete this.instance;
  },

};
