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
  
  /**
   * Generate array of docker pull promises and wait until aa resolved to return
   * @param {Object} payload
   * @param {Array} payload.comps
   * @param {Object} payload.window UI Calls Only
   * @return {Promise<array>} Resolves to array of success flags for each computation in comps array
   */
  pullPipelineComputations(payload) {
    /*
    const compsP = payload.comps.reduce((arr, img) => {
      arr.push(this.adapter.pullImage(Object.assign({}, payload, { img })));
      return arr;
    }, []);

    return Promise.all(compsP)
    .then(res => res)
    .catch(console.log);
    */
  }

  validateComputation(id) {
    // TODO: Return boolean for whether or not computation is approved
    console.log('validate');
  }

  /**
   * Server
   */

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
