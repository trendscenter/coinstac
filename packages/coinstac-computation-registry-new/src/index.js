'use strict';

const CLIAdapter = require('./adapters/cli-adapter');
const TestAdapter = require('./adapters/test-adapter');
const UIAdapter = require('./adapters/ui-adapter');

/**
 * ComputationRegistry
 * @class
 * @param string adapter Determines which adapter to use: cli or ui (Server uses cli)
 */
class ComputationRegistry {
  constructor(adapter) {
    if (adapter === 'cli') {
      this.adapter = new CLIAdapter();
    } else {
      this.adapter = new UIAdapter();
    }
  }

  /**
   * Client
   */

  getAllComputations() {
    // TODO: Return IDs, image name and comp names from all computations
  }

  getMetadataForName(imageName) {
    // TODO: Return all metadata for given image name
  }

  /**
   * Generate array of docker pull promises and wait until aa resolved to return
   * @param {Object} payload
   * @param {Array} payload.comps
   * @param {Object} payload.window UI Calls Only
   * @return {Promise<array>} Resolves to array of success flags for each computation in comps array
   */
  pullPipelineComputations(payload) {
    const compsP = payload.comps.reduce((arr, img) => {
      arr.push(this.adapter.pullImage(Object.assign({}, payload, { img })));
      return arr;
    }, []);

    return Promise.all(compsP)
    .then(res => res)
    .catch(console.log);
  }

  validateComputation(id) {
    // TODO: Return boolean for whether or not computation is approved
  }

  /**
   * Server
   */

  /**
   * Submit computation schema for approval
   * @param {Object} comp - authors computation schema
   */
  addComputation(comp) { // eslint-disable-line class-methods-use-this
    // TODO: Insert passed-in computation schema to DB
  }

  /**
   * Remove computation schema
   * @param {int} id - authors computation schema
   */
  removeComputation(id) { // eslint-disable-line class-methods-use-this
    // TODO: Remove passed-in computation id from DB
  }

  /**
   * On server start, pull in comps from whitelist and download via docker
   *    Synchronous pull and DB save in order to avoid multiple same named files
   *    in /tmp and to avoid simultaneous DB saves
   * @return {Promise<string>} Success flag
   */
  serverStart() {
    // TODO: comps = DB Pull of approved computations
    return this.pullPipelineComputations({ comps });
  }
}

module.exports = ComputationRegistry;
