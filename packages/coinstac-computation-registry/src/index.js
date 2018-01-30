'use strict';

const axios = require('axios');
const { getAllImages, pullImage, removeImage } = require('coinstac-docker-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const { reduce } = require('lodash');
const config = require('../config/default');

/**
 * ComputationRegistry
 * @class
 */
class ComputationRegistry {
  constructor(params) {
    if (params.credentials) {
      this.credentials = params.credentials;
    }
  }

  /**
   * Connects to API Server to get a JSON token
   * @return {string} JSON web token
   */
  authenticateServer() {
    return axios.post(
      `${config.DB_URL}/authenticate`,
      this.credentials
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

  /**
   * Retrieve list of all local Docker images from docker-manager package
   * @return {Object[]} Array of objects containing locally stored Docker images
   */
  static getImages() {
    return getAllImages();
  }

  /**
   * Generate array of docker pull promises and wait until resolved to return merged output streams
   * pulls from docker-manager package
   * @param {Object[]} comps array of computation objects to download
   * @param {String} comps.img Docker image name
   * @param {String} comp.compId Computation ID from app DB
   * @param {String} comp.compName Computation name from DB
   * @return {Object} Returns array of objects containing stream and computation parameters
   */
  static pullComputations(comps) {
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

  /**
   * Remove the Docker image associated with the image id
   * calls to docker-manager package
   * @param {string} imgId ID of image to remove
   * @return {Promise}
   */
  static removeDockerImage(imgId) {
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
