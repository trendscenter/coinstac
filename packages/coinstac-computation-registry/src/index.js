'use strict';

const axios = require('axios');
const { getAllImages, pullImage, removeImage } = require('coinstac-docker-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const mergeStream = require('merge-stream');
const { compact, reduce } = require('lodash');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path
const config = require('../config/default');

/**
 * ComputationRegistry
 * @class
 */
class ComputationRegistry {
  authenticateServer() {
    return axios.post(
      `${config.DB_URL}/authenticate`,
      dbmap.rethinkdbServer
    )
    .then((token) => {
      this.id_token = token.data.id_token;
      axios.defaults.headers.common.Authorization = `Bearer ${this.id_token}`;
      return this.id_token;
    });
  }

  /**
   * Client
   */

  getImages() { // eslint-disable-line class-methods-use-this
    return getAllImages();
  }

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

  pullComputations(comps) { // eslint-disable-line class-methods-use-this
    const compsP = reduce(comps, (arr, comp) => {
      arr.push(pullImage(comp.img));
      return arr;
    }, []);

    return Promise.all(compsP)
    .then((res) => {
      return comps.map((val, index) =>
        ({ stream: res[index], compId: val.compId, compName: val.compName })
      );
    });
  }

  removeDockerImage(imgId) { // eslint-disable-line class-methods-use-this
    return removeImage(imgId);
  }

  validateComputation(id) { // eslint-disable-line class-methods-use-this, no-unused-vars
    // TODO: Return boolean for whether or not computation is approved
    console.log('validate'); // eslint-disable-line no-console
  }

  /**
   * Server
   */

  /**
   * On server start, pull in comps from DB whitelist and download via docker
   * @return {Promise<string>} Success flag
   */
  serverStart() {
    return this.authenticateServer()
    .then(() =>
      axios.get(`${config.DB_URL}/graphql?query=${graphqlSchema.queries.allDockerImages}`)
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
