'use strict';

/**
 * @private
 * @module db-server
 */

require('./utils/handle-errors');

const axios = require('axios');
const cloneDeep = require('lodash/cloneDeep');
const config = require('./utils/config');
const { logger } = require('./utils/logging');
const pdbs = require('spawn-pouchdb-server');

const pouchDBServerConfig = config['pouch-db-server'];

/**
 * Placeholder for the server.
 *
 * @type {(undefined|Function)}
 */
let server;

/**
 * Get remote result.
 *
 * Get the last remote result output from the current computation.
 *
 * @returns {Promise<Object>}
 */
function getRemoteResult() {
  const host = `http://localhost:${pouchDBServerConfig.port}`;

  return axios.get(`${host}/_all_dbs`)
    .then((result) => {
      const remoteDb = result.data.find(db => db.includes('remote-consortium-'));

      if (!remoteDb) {
        throw new Error('Remote consortium database not found');
      }

      return axios.get(`${host}/${remoteDb}/_all_docs?include_docs=true`);
    })
    .then((result) => {
      if (!result.data.rows.length) {
        throw new Error('No remote consortium results');
      }

      return result.data.rows[0].doc.data;
    });
}

/**
 * @function setup
 * @description boots a pouchdb-server, a dbRegistry instance, and
 * a computation registry instance.  these utilities are commonly
 * required for PipelineRunnerPool testing
 *
 * @param {Object} params
 * @param {string} params.computationPath Path to the decentralized computation
 * definition
 * @param {string[]} params.usernames
 * @returns {Promise}
 */
function setup() {
  if (server) {
    return Promise.reject(new Error('Server already instantiated'));
  }

  return new Promise((resolve, reject) => {
    // spawn-pouchdb-server mutates user input >:(
    // https://github.com/hoodiehq/spawn-pouchdb-server/pull/33
    pdbs(cloneDeep(pouchDBServerConfig), (error, srv) => {
      if (error) {
        reject(error);
      } else {
        server = srv;
        resolve(server);
      }
    });
  })
    .then(() => {
      logger.info(
        `pouchdb-server running on http://localhost:${pouchDBServerConfig.port}`
      );

      return server;
    });
}

/**
 * @returns {Promise}
 */
function teardown() {
  if (!server) {
    return Promise.reject(new Error('Server not instantiated'));
  }

  return new Promise((resolve, reject) => {
    server.stop((code, signal) => {
      if (code) {
        reject(new Error(
          `pouchdb-server exited with code ${code}, signal ${signal}`
        ));
      } else {
        server = undefined;
        resolve();
      }
    });
  });
}

module.exports = {
  getRemoteResult,
  setup,
  teardown,
};

