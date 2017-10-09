'use strict';

const axios = require('axios');
const { pullImage } = require('coinstac-docker-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const mergeStream = require('merge-stream');
const { compact } = require('lodash');
const config = require('../config/comp-reg-config');

const DB_URL = 'http://localhost:3100';

/**
 * ComputationRegistry
 * @class
 */
class ComputationRegistry {
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
   * Generate array of docker pull promises and wait until resolved to return merged output streams
   * @param {Object} payload
   * @param {Array} [payload.comps] array of computation images to download
   * @return {Object} Returns merged streams docker pull output 
   */
  pullPipelineComputations(payload) { // eslint-disable-line class-methods-use-this
    const merged = mergeStream();

    const compsP = compact(payload.comps).reduce((arr, img) => {
      arr.push(pullImage(img));
      return arr;
    }, []);

    return Promise.all(compsP)
    .then(res => merged.add(res));
  }

  validateComputation(id) {
    // TODO: Return boolean for whether or not computation is approved
    console.log('validate');
  }

  /**
   * Server
   */

  /**
   * On server start, pull in comps from DB whitelist and download via docker
   * @return {Promise<string>} Success flag
   */
  serverStart() {
    this.authenticateServer()
    .then(() =>
      axios.get(`${DB_URL}/graphql?query=${graphqlSchema.queries.allDockerImages}`)
    )
    .then(({ data: { data: { fetchAllComputations } } }) => {
      const comps = fetchAllComputations.map(comp => comp.computation.dockerImage);
      return this.pullPipelineComputations({ comps });
    })
    .then((pullStreams) => {
      pullStreams.pipe(process.stdout);
    });
  }
}

module.exports = ComputationRegistry;
