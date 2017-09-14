'use strict';

const axios = require('axios');
const { compact } = require('lodash');
const dbmap = require('/coins/config/dbmap');
const config = require('../config/comp-reg-config');
const CLIAdapter = require('./adapters/cli-adapter');
// const TestAdapter = require('./adapters/test-adapter');
const UIAdapter = require('./adapters/ui-adapter');

const DB_URL = 'http://localhost:3100';

/**
 * ComputationRegistry
 * @class
 * @param {string} adapter Determines which adapter to use: cli or ui (Server uses cli)
 */
class ComputationRegistry {
  constructor(adapter) {
    if (adapter === 'cli') {
      this.adapter = new CLIAdapter();
    } else {
      this.adapter = new UIAdapter();
    }

    this.id_token = '';
  }

  authenticateServer() {
    return axios.post(
      `${DB_URL}/authenticate`,
      {
        username: config.serverUser,
        password: config.serverPassword,
      }
    )
    .then((token) => {
      this.id_token = token.data.id_token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.id_token}`;
      return this.id_token;
    });
  }

  /**
   * Client
   */

  /**
   * Generate array of docker pull promises and wait until resolved to return
   * @param {Object} payload
   * @param {Array} payload.comps
   * @param {Object} payload.window UI Calls Only
   * @return {Promise<array>} Resolves to array of success flags for each computation in comps array
   */
  pullPipelineComputations(payload) { // eslint-disable-line class-methods-use-this
    const compsP = compact(payload.comps).reduce((arr, img) => {
      arr.push(this.adapter.pullImageWrapper(Object.assign({}, payload, { img })));
      return arr;
    }, []);

    return Promise.all(compsP)
    .then(res => res)
    .catch(console.log);
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
    this.authenticateServer()
    .then(() =>
      axios.get(`${DB_URL}/graphql?query={fetchAllComputations{meta{dockerImage}}}`)
    )
    .then((res) => {
      const comps = res.data.data.fetchAllComputations.map(comp => comp.meta.dockerImage);
      return this.pullPipelineComputations({ comps });
    });
  }
}

module.exports = ComputationRegistry;
