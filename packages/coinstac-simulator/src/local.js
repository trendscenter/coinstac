'use strict';

/**
 * @private
 * @module local
 */

require('./utils/handle-errors');

const CoinstacClient = require('coinstac-client-core');
const coinstacCommon = require('coinstac-common');
const path = require('path');
const pouchDBAdapterMemory = require('pouchdb-adapter-memory');
const retry = require('retry');

const config = require('./utils/config.js');
const getComputationRegistryStub =
  require('./utils/get-computation-registry-stub.js');
const { getChildProcessLogger } = require('./utils/logging.js');

const dbRegistry = coinstacCommon.services.dbRegistry;
const logger = getChildProcessLogger();
const pouchDBServerConfig = config['pouch-db-server'];

dbRegistry.DBRegistry.Pouchy.plugin(pouchDBAdapterMemory);

let initiate = false;
let client;
let username;

/**
 * Get all documents.
 *
 * This function attempts to combat latency and an undetermined race condition
 * with two methods:
 *
 * 1. Retrieving a 'synced' Pouchy instance with the `getSyncedDatabase` utility
 * 2. Using `retry` to re-request documents if none are fetched.
 *
 * {@link https://github.com/MRN-Code/coinstac/issues/27}
 *
 * @param {DBRegistry} dbRegistry
 * @param {string} dbName
 * @returns {Promise}
 */
function getAllDocuments(dbRegistry, dbName) {
  const getSyncedDatabase = coinstacCommon.utils.getSyncedDatabase;

  return getSyncedDatabase(dbRegistry, dbName).then(database => {
    const operation = retry.operation({
      maxTimeout: 3000,
      minTimeout: 250,
      retries: 5,
    });

    return new Promise((resolve, reject) => {
      operation.attempt(currentAttempt => {
        database.all()
          .then(docs => {
            if (!docs.length) {
              throw new Error(`${dbName} database contains no documents`);
            }

            logger.verbose(`Database ${dbName} .all() attempts: ${currentAttempt}`);

            operation.stop();
            resolve(docs);
          })
          .catch(error => {
            if (!operation.retry(error)) {
              reject(operation.mainError());
            }
          });
      });
    });
  });
}

/**
 * Boot local process.
 *
 * @param {Object} params
 * @param {string} params.computationPath
 * @param {Object} [params.data]
 * @param {boolean} [params.initiate=false] Whether the process should initiate
 * the computation run.
 * @param {string} params.username
 * @returns {Promise}
 */
function boot({
  computationPath,
  data,
  initiate: init,
  username: uname,
}) {
  initiate = init;
  username = uname;

  client = new CoinstacClient({
    appDirectory: path.resolve(__dirname, '../.tmp/'),
    db: {
      remote: {
        db: {
          hostname: 'localhost',
          pathname: '',
          port: pouchDBServerConfig.port,
          protocol: 'http',
        },
      },
      pouchConfig: {
        adapter: 'memory',
      },
    },
    hp: 'http://localhost:8801/api/v1.3.0',
    logger,
  });

  /**
   * Stub computation registry and its private `CoinstacClient` instantiation
   * method to load the computation under test.
   */
  client._initComputationRegistry = function compRegStub() {
    client.computationRegistry = getComputationRegistryStub(computationPath);
    return Promise.resolve(client.computationRegistry);
  };

  client._initAuthorization = function authStub(user) {
    client.auth.setUser(user);
    return Promise.resolve(user);
  };

  return client.initialize({
    email: `${username}@mrn.org`,
    password: 'dummypw',
    name: username,
    username,
  })
    .then(() => Promise.all([
      getAllDocuments(client.dbRegistry, 'consortia'),
      client.projects.getCSV(data.metaFilePath),
    ]))
    .then(([[{ _id: consortiumId }], csv]) => {
      logger.verbose('Saving project');

      const metaFile = JSON.parse(csv);

      return client.projects.save({
        consortiumId,
        files: client.projects.getFilesFromMetadata(
          data.metaFilePath,
          metaFile
        ),
        metaFile,
        metaFilePath: data.metaFilePath,
        metaCovariateMapping: data.metaCovariateMapping,
        name: `${username}'s project`,
      });
    })
    .then(({ _id }) => client.projects.setMetaContents(_id));
}

/**
 * @function kickoff
 * @description starts a run. if the initiator, kicks-off immediately. others
 * who want to kickoff wait for a remote result doc, then proceed to kickoff
 * @warning computation and consortium selected are always the first doc
 * in their DB set. runId is also _always_ 'test_run_id'
 * @param {function} cb
 * @returns {Promise}
 */
const kickoff = function kickoff() {
  logger.verbose(`${username} kicking off`);

  return Promise.all([
    getAllDocuments(client.dbRegistry, 'consortia'),
    getAllDocuments(client.dbRegistry, 'projects'),
  ])
    .then(([consortiaDocs, projectsDocs]) => {
      if (!consortiaDocs.length) {
        throw new Error('Couldn\'t get consortia docs');
      } else if (!projectsDocs.length) {
        throw new Error('Couldn\'t get projects docs');
      }

      const consortiumId = consortiaDocs[0]._id;
      const projectId = projectsDocs[0]._id;

      if (initiate) {
        logger.verbose(`${username} initiating`);
        return client.computations.kickoff({
          consortiumId,
          projectId,
        });
      }

      const remoteResultDB = client.dbRegistry.get(
        `remote-consortium-${consortiumId}`
      );

      return new Promise((res, rej) => {
        const pollForRemoteResult = setInterval(
          // test if remote result present yet
          () => {
            remoteResultDB.all()
            .then((docs) => {
              if (!docs || !docs.length) {
                return null;
              }
              clearInterval(pollForRemoteResult);
              return res([consortiumId, projectId, docs[0]._id]);
            })
            .catch((err) => {
              clearInterval(pollForRemoteResult);
              return rej(err);
            });
          },
          50
        );
      })
      .then(([consortiumId, projectId, runId]) => {
        logger.verbose(`${username} triggering runner`);

        return client.computations.joinRun({
          consortiumId,
          projectId,
          runId,
        });
      });
    });
};

// boot with data provided by src/boot-locals.js
process.on('message', (opts) => {
  if (opts.boot) {
    boot(opts.boot)
    .then(() => process.send({ ready: true }));
  } else if (opts.kickoff) {
    kickoff();
  } else if (opts.teardown) {
    // @NOTE tearing down the pool then exiting has problems. these are pouchdb
    // internal issues with the sync api.
    // just exit.  everything is memdown'd anyway! faster :horse:
    // pool.destroy().then(() => ...)
    process.send({ toredown: true });
    process.exit(0);
  } else {
    throw new Error('message from parent process has no matching command', opts);
  }
});
