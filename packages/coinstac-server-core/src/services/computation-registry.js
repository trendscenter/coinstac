'use strict';

/**
* @module service/computation-registry
*/

const os = require('os');
const mkdirp = require('mkdirp-promise');
const path = require('path');
const coinstacCommon = require('coinstac-common');

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
    return coinstacCommon.services.computationRegistry({
      isRemote: true,
      path: this.getComputationsPath(),
    })
    .then((reg) => (this.instance = reg))
    .then(() => this.upsertComputationsDir())
    .then(() => this.get());
  },

  /**
   * upsert computations dir.
   * @returns {Promise} resolves with computations dir
   */
  upsertComputationsDir() {
    return mkdirp(this.getComputationsPath());
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
