'use strict';

/**
 * @private
 * @module db-server
 */

require('./utils/handle-errors');

const cloneDeep = require('lodash/cloneDeep');
const common = require('coinstac-common');
const config = require('./utils/config');
const { logger } = require('./utils/logging');
const pdbs = require('spawn-pouchdb-server');
const Pouchy = require('pouchy');
const url = require('url');

const Consortium = common.models.Consortium;
const pouchDBServerConfig = config['pouch-db-server'];

/**
 * Placeholder for the server.
 *
 * @type {(undefined|Function)}
 */
let server;

function addDocument(pathname, doc) {
  const dbUrl = url.format({
    hostname: 'localhost',
    pathname,
    port: pouchDBServerConfig.port,
    protocol: 'http',
  });

  const db = new Pouchy({
    url: dbUrl,
    sync: 'out',
  });

  return db.save(doc);
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
function setup({ computationPath, usernames }) {
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
      const defaultConsortium = new Consortium({
        _id: `testconsortiumid${Date.now()}`,
        description: 'test-default-consortium',
        label: 'test-default-consortium',
        owners: usernames,
        users: usernames,
      });
      /* eslint-disable global-require */
      const decentralizedComputation = require(computationPath);
      /* eslint-enable global-require */
      const computationDoc = {
        _id: 'testcomputationid',
        name: decentralizedComputation.name,
        version: decentralizedComputation.version,
      };

      return Promise.all([
        addDocument('consortia', defaultConsortium.serialize()),
        addDocument('computations', computationDoc),
      ]);
    })
    .then(responses => {
      logger.info('Seeded database', {
        consortium: responses[0]._id,
        computation: responses[1].name,
      });

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

