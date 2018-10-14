'use strict';

require('../../../../helpers/boot');
const test = require('tape');
const poolUtils = require('./.test-pool-utils');
const common = require('../../../../../');

const computation = common.models.computation;
const Consortium = common.models.Consortium;
const LocalPipelineRunnerPool = common.models.pipeline.runner.pool.LocalPipelineRunnerPool;
const RemoteComputationResult = computation.RemoteComputationResult;
const assign = require('lodash/assign');

/**
 * @function remoteResultOpts
 * @description get a functional set of constructor opts for RemoteComputationResult
 */
const remoteResultOpts = (opts) => {
  return assign({
    _id: 'runId-userName',
    usernames: ['testUser'],
    // consortiumId - opts must provide!
    // computationId - opts must provide!
  }, opts);
};

const getDummyConsortium = (() => {
  let count = 0;
  return () => {
    count += 1;
    return new Consortium({
      _id: `testconsortium${count}`,
      description: `test-consortium-${count}`,
      label: `test-consortium-${count}`,
      users: [],
      owners: [],
    });
  };
})();

const setupServer = () => poolUtils.setup();
const teardownServer = () => poolUtils.teardown();

/**
 * this test is _complex_, hence, it is annotated.
 * we will build all the necessary inputs for a PipelineRunnerPool, inject some
 * state into a temp db, and simulate some actions to watch our pool respond
 * to db activity
 */
test('local-runner-pool builds & execs runners in response to db events', (t) => {
  const compId = 'testlocalrunnerpool';

  t.plan(4);

  setupServer()
    // stub in a computation, allowing LocalPipeLineRunnerPool to instantiate
    // a LocalPipeLineRunner the `local` pipline defined
    .then(() => poolUtils.stubBasicComputation(compId))
    .then(() => {
      const consortium = getDummyConsortium();
      const runId = 'testRunDBChangeEvents';
      const remoteComputationOpts = remoteResultOpts({
        _id: runId,
        computationId: compId,
        consortiumId: consortium._id,
        computationInputs: [[
          ['TotalGrayVol'],
          200,
        ]],
      });
      const remoteResult = new RemoteComputationResult(remoteComputationOpts);

      // create pool instance
      const tPoolOpts = poolUtils.getPoolOpts({
        user: poolUtils.getDummyUser(),
        dbRegistry: { isLocal: true },
      });
      const pool = new LocalPipelineRunnerPool(tPoolOpts);
      poolUtils.suppressCreateDestroyHandlers(pool);

      // add in a consortium for pool to listen to events on
      pool.dbRegistry.get('consortia')
        .save(consortium.serialize())

      // add computation to computations db
        .then(() => {
          return pool.dbRegistry.get('computations')
            .save({ _id: compId, name: compId, version: compId });
        })

      // initialize pool
      // `.init` after consortia has docs s.t. listeners are auto created
        .then(() => pool.init())

      // create new database for remote results, sync a remote result, which
      // will trigger LocalPipeLineRunnerPool to start a new LocalPipeLineRunner
        .then(() => {
          return pool.dbRegistry.get(`remote-consortium-${consortium._id}`)
            .save(remoteResult.serialize());
        })

        .catch(t.end);

      // listen for the run to begin as consequence of seeing a new document
      // @note fired twice in this test. first from the saved consortium,
      // second from the `pool.triggerRunner` call
      pool.events.on('run:start', () => {
        t.pass('run started from new db document event');
      });
      pool.events.on('run:end', (result) => {
        if (!result.data) {
          // we know that the remote doc kicked off a computation, but it
          // noop'd because there was no user data yet! stub in dummy user data
          return pool.triggerRunner(result, { kickoff: true });
        }
        t.equal(
          result.data,
          compId,
          'LocalPipelineRunner instantiated & returned local pipeline result'
        );
        return null;
      });
      pool.events.on('queue:end', () => {
        pool.destroy({ deleteDBs: true })
          .then(() => teardownServer())
          .then(() => t.pass('pool teardown'))
          .then(t.end, t.end);
      });
    });
});
