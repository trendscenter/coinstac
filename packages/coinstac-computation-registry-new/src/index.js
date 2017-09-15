'use strict';

const axios = require('axios');
const { pullImage } = require('coinstac-docker-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const mergeStream = require('merge-stream');
const { compact } = require('lodash');

/**
 * ComputationRegistry
 * @class
 */
class ComputationRegistry {

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
    axios.get(`http://localhost:3100/graphql?query=${graphqlSchema.allDockerImages}`)
    .then(({ data: { data: { fetchAllComputations } } }) => {
      const comps = fetchAllComputations.map(comp => comp.meta.dockerImage);
      return this.pullPipelineComputations({ comps });
    })
    .then((pullStreams) => {
      pullStreams.pipe(process.stdout);
    });
  }
}

module.exports = ComputationRegistry;
