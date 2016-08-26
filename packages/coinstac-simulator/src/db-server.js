'use strict';

/**
 * @private
 * @module db-server
 */

require('./handle-errors');

const cloneDeep = require('lodash/cloneDeep');
const common = require('coinstac-common');
const dbConf = require('./.pouchdb-server-config');
const logger = require('./logger');
const pdbs = require('spawn-pouchdb-server');
const pdbsConfig = require('./.pouchdb-server-config');
const Pouchy = require('pouchy');
const url = require('url');

const Consortium = common.models.Consortium;

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
    port: dbConf.port,
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
 * @param {string} declPath Path to the declaration file
 * @returns {Promise}
 */
function setup(declPath) {
  if (server) {
    return Promise.reject(new Error('Server already instantiated'));
  }

  const decl = require(declPath); // eslint-disable-line global-require

  return new Promise((resolve, reject) => {
    // spawn-pouchdb-server mutates user input >:(
    // https://github.com/hoodiehq/spawn-pouchdb-server/pull/33
    pdbs(cloneDeep(pdbsConfig), (error, srv) => {
      if (error) {
        reject(error);
      } else {
        server = srv;
        resolve(server);
      }
    });
  })
    .then(() => {
      logger.info(`pouchdb-server running on http://localhost:${pdbsConfig.port}`);
      const users = decl.users.map(u => u.username);
      const defaultConsortium = new Consortium({
        _id: `testconsortiumid${Date.now()}`,
        description: 'test-default-consortium',
        label: 'test-default-consortium',
        owners: users,
        users,
      });
      /* eslint-disable global-require */
      const decentralizedComputation = require(decl.computationPath);
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

