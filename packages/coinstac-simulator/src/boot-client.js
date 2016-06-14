'use strict';

/**
 * @private
 * @module boot-client
 */

require('./handle-errors')();
const poolInitializer = require('./pool-initializer');
const common = require('coinstac-common');
const User = common.models.User;
const stubComputationToRegistry = require('./stub-computation-to-registry');
const LocalPipelineRunnerPool = common.models.pipeline.runner.pool.LocalPipelineRunnerPool;
const RemoteComputationResult = common.models.computation.RemoteComputationResult;
const logger = require('./logger');

let pool;
let decl;
let username;

const boot = function boot(opts) {
  if (!opts.declPath || !opts.username) {
    throw new ReferenceError('missing decl or username');
  }
  decl = require(opts.declPath);
  username = opts.username;
  const poolPatch = { dbRegistry: { isLocal: true } };

  return poolInitializer.getPoolOpts(poolPatch)
  .then((_opts) => {
    const runnerOpts = Object.assign({}, _opts);
    runnerOpts.user = new User({
      username,
      email: `${username}@simulating.org`,
      password: 'dummypw',
    });
    pool = new LocalPipelineRunnerPool(runnerOpts);
    pool.events.on('error', (err) => logger.error(err.message));
    return pool.init()
    .then(() => {
      // stub registry (to circumvent needing to d/l DecentralizedComputation)
      const decentralizedComputation = require(decl.computationPath);
      return stubComputationToRegistry({
        computation: decentralizedComputation,
        registry: pool.computationRegistry,
      });
    });
  });
};

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
  let consortiumDoc;
  let computationDoc;
  let remoteResult;
  const consortiaDB = pool.dbRegistry.get('consortia');
  const computationDB = pool.dbRegistry.get('computations');
  const usernames = decl.users.map(user => user.username);
  const isInitiator = username === usernames[0];
  // get consortium we're working in the context of
  return consortiaDB.all()
  .then((docs) => { consortiumDoc = docs[0]; })
  // get computation we're working in the context of
  .then(() => computationDB.all())
  .then((docs) => { computationDoc = docs[0]; })
  // wait for remote result if we are _not_ the initiator to begin our kickoff
  .then(() => {
    if (isInitiator) {
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
    const user = decl.users.find(usr => usr.username === username);
    let userData;
    // inject requested userData into pipeline runner
    // if none specific, inject default data, declaring that we
    // are kicking off
    if (user.userData) {
      userData = user.userData;
    } else {
      userData = { kickoff: true }; // default to generic
    }
    return userData;
  })
  .then((userData) => pool.triggerRunner(remoteResult, userData));
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

// @NOTE the following is useful for debugging when running just a single process
// vs letting the runner fire this as a child process
// boot({
//     decl: {
//       usernames: [
//             'chris',
//             'runtang',
//             'vince',
//             'margaret'
//         ],
//         computationPath: require('path').resolve(__dirname, '../src/distributed/group-add'),
//         verbose: true
//     },
//     username: 'chris'
// }, (err, r) => {
//     if (err) throw err
// });
