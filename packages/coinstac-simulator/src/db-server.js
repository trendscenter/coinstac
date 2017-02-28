'use strict';

/**
 * @private
 * @module db-server
 */

require('./utils/handle-errors');

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
  setup,
  teardown,
};

