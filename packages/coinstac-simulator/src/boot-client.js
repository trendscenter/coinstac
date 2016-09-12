'use strict';

/**
 * @private
 * @module boot-client
 */

require('./utils/handle-errors');

const poolInitializer = require('./pool-initializer');
const common = require('coinstac-common');
const User = common.models.User;
const stubComputationToRegistry = require('./stub-computation-to-registry');
const LocalPipelineRunnerPool = common.models.pipeline.runner.pool.LocalPipelineRunnerPool;
const RemoteComputationResult = common.models.computation.RemoteComputationResult;
const { getChildProcessLogger } = require('./utils/logging');
const retry = require('retry');

const logger = getChildProcessLogger();

/**
 * Placeholder for user's data. This is used with
 * @type {Object}
 */
let userData = {
  kickoff: true,
};

let initiate = false;
let pool;
let username;


/**
 * Boot client.
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

  if (data) {
    userData = data;
  }

  return poolInitializer.getPoolOpts({ dbRegistry: { isLocal: true } })
    .then(opts => {
      pool = new LocalPipelineRunnerPool(Object.assign({
        user: new User({
          username,
          email: `${username}@simulating.org`,
          password: 'dummypw',
        }),
      }, opts));
      pool.events.on('error', logger.error);

      return pool.init();
    })
    .then(() => {
      // stub registry (to circumvent needing to d/l DecentralizedComputation)
      /* eslint-disable global-require */
      const decentralizedComputation = require(computationPath);
      /* eslint-enable global-require */
      return stubComputationToRegistry({
        computation: decentralizedComputation,
        registry: pool.computationRegistry,
      });
    });
}

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
  const getSyncedDatabase = common.utils.getSyncedDatabase;

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
 * @function kickoff
 * @description starts a run. if the initiator, kicks-off immediately. others
 * who want to kickoff wait for a remote result doc, then proceed to kickoff
 * @warning computation and consortium selected are always the first doc
 * in their DB set. runId is also _always_ 'test_run_id'
 * @param {function} cb
 * @returns {Promise}
 */
const kickoff = function kickoff() {
  const dbRegistry = pool.dbRegistry;
  let consortiumDoc;
  let computationDoc;
  let remoteResult;

  logger.verbose(`${username} kicking off`);

  return Promise.all([
    getAllDocuments(dbRegistry, 'consortia'),
    getAllDocuments(dbRegistry, 'computations'),
  ])
    .then(([consortiaDocs, computationDocs]) => {
      if (!consortiaDocs.length) {
        throw new Error('Couldn\'t get consortia docs');
      } else if (!computationDocs.length) {
        throw new Error('Couldn\'t get computations docs');
      }

      consortiumDoc = consortiaDocs[0];
      computationDoc = computationDocs[0];

      if (initiate) {
        logger.verbose(`${username} initiating`);
        remoteResult = new RemoteComputationResult({
          _id: 'test_run_id',
          computationId: computationDoc._id,
          consortiumId: consortiumDoc._id,
        });
        return remoteResult;
      }
      const remoteResultDB = pool.dbRegistry.get(
        `remote-consortium-${consortiumDoc._id}`
      );
      return new Promise((res, rej) => {
        const pollForRemoteResult = setInterval(
          // test if remote result present yet
          () => {
            remoteResultDB.all()
            .then((docs) => {
              if (!docs || !docs.length) { return null; }
              remoteResult = new RemoteComputationResult(docs[0]);
              clearInterval(pollForRemoteResult);
              return res(remoteResult);
            })
            .catch((err) => {
              clearInterval(pollForRemoteResult);
              return rej(err);
            });
          },
          50
        );
      });
    })
    .then(() => {
      logger.verbose(`${username} triggering runner`);
      pool.triggerRunner(remoteResult, userData);
    });
};

// boot with data provided by `boot-clients`
process.on('message', (opts) => {
  if (opts.boot) {
    boot(opts.boot)
    .then((result) => process.send({ ready: true, result }));
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
