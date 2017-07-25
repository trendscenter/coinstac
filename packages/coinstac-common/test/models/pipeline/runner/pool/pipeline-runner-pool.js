'use strict';

/**
 * @NOTE because tape exits tests _early_, after teardown it's imperative to add
 * an extra assertion to make sure things toredown correctly.  that is, teardown
 * MUST be assert if it's async.
 */
require('../../../../helpers/boot');
const test = require('tape');
const poolUtils = require('./.test-pool-utils');
const EventEmitter = require('events').EventEmitter;
const common = require('../../../../../');

const computation = common.models.computation;
const Consortium = common.models.Consortium;
const Pouchy = require('pouchy');

const PipelineRunnerPool = common.models.pipeline.runner.pool.PipelineRunnerPool;
const ComputationResult = computation.ComputationResult;
const LocalComputationResult = computation.LocalComputationResult;
const RemoteComputationResult = computation.RemoteComputationResult;
const LocalPipelineRunner = common.models.pipeline.runner.LocalPipelineRunner;
const pipelines = require('../../.test-pipelines');
const assign = require('lodash/assign');

/**
 * @function remoteResultOpts
 * @description get a functional set of constructor opts for LocalComputationResult
 */
const remoteResultOpts = (opts) => {
  return assign({
    _id: 'runId',
    usernames: ['testUser'],
    consortiumId: 'test-consortium',
    computationId: 'testcomputation-testversion',
    computationInputs: [[
      ['TotalGrayVol'],
      200,
    ]],
  }, opts);
};

/**
 * @function localResultOpts
 * @description get a functional set of constructor opts for LocalComputationResult
 */
const localResultOpts = (opts) => {
  return assign({
    _id: 'runId-userName',
    consortiumId: 'test-consortium',
    computationId: 'testcomputation-testversion',
    username: 'testUser',
    userData: { kickoff: true },
  }, opts);
};

const setupServer = () => poolUtils.setup();
const teardownServer = () => poolUtils.teardown();


test('PipelineRunnerPool - handles new dbs', (t) => {
  // @TODO handle https://github.com/pouchdb/pouchdb/issues/4922
  t.plan(3);
  setupServer().then(() => {
    const poolOpts = poolUtils.getPoolOpts({ dbRegistry: { isRemote: true } });
    t.throws(
      PipelineRunnerPool.prototype._handleCreatedDB,
      'abstract unextended handleCreatedDB throws'
    );
    const pool = new PipelineRunnerPool(poolOpts);
    pool._handleCreatedDB = function _handleCreatedDB(dbName) {
          // see above issue for early return justification
      if (this.createdHandlerCalled) { return; }
      this.createdHandlerCalled = true;
      t.ok(dbName, 'created db handler called');
      pool.destroy({ deleteDBs: true })
      .then(() => teardownServer())
      .then(() => t.pass('teardown ok'))
      .then(t.end, t.end);
    };
    pool.init().catch(t.end);
  });
});

test('queues processing for rapid succession database events', (t) => {
  t.plan(3);
  setupServer().then(() => {
    const runId = 'testrun123';
    const resultOpts = localResultOpts({ _id: `${runId}-bilboBaggins` });
    const localResult1 = new LocalComputationResult(resultOpts);
    const localResult2 = new LocalComputationResult(resultOpts);
    const tDB = new Pouchy({ name: 'queue-db', pouchConfig: { adapter: 'memory' } });
    const runner = new LocalPipelineRunner({
      pipeline: pipelines.userTriggeredStepping(), // generic _async_ js pipeline
      result: localResult1,
      db: tDB,
    });
    const pool = new PipelineRunnerPool(poolUtils.getPoolOpts({ dbRegistry: { isLocal: true } }));
    poolUtils.suppressCreateDestroyHandlers(pool);
    pool.runners[runId] = runner; // stub in the pipeline-runner

    const origRunnerRun = runner.run;
    let callCount = 0;
    runner.run = (opts) => {
      callCount += 1;
      if (callCount === 1) {
        t.equal(
          pool.runQueueSize[runId],
          1,
          'exactly one job actively running, after runner.run called once'
        );
      } else if (callCount === 2) {
        t.equal(
          pool.runQueueSize[runId],
          0,
          'exactly zero jobs actively running, after runner.run called twice'
        );
      }
      return origRunnerRun.call(runner, opts);
    };

    // manually `triggerRunner`, whereas db events generally exec this
    // behavior
    pool.init()
    .then(() => {
      pool.triggerRunner(localResult1); // fire the requests ~concurrently
      return pool.triggerRunner(localResult2);
    })
    .then(() => pool.destroy({ deleteDBs: true }))
    .then(() => teardownServer())
    .then(() => t.pass('teardown ok'))
    .then(() => t.end(), t.end);
  });
});

test('does not proceed queue whilst pipeline is `inProgress`', (t) => {
  t.plan(5);
  setupServer().then(() => {
    const localResult = new LocalComputationResult(localResultOpts());
    const remoteResult1 = new RemoteComputationResult(remoteResultOpts());
    const remoteResult2 = new RemoteComputationResult(remoteResultOpts());
    const remoteResult3 = new RemoteComputationResult(remoteResultOpts());
    const runner = new LocalPipelineRunner({
      pipeline: pipelines.basicMultiAsyncStep(), // steps sync, then async
      result: localResult,
      db: new Pouchy({ name: 'queue-db', pouchConfig: { adapter: 'memory' } }),
    });
    const pool = new PipelineRunnerPool(poolUtils.getPoolOpts({ dbRegistry: { isLocal: true } }));
    poolUtils.suppressCreateDestroyHandlers(pool);
    pool.runners[localResult.runId] = runner; // stub in the runner
    const getQueLen = () => pool.runQueueSize[localResult.runId];
    let requestComplete = 0;

    // pipeline is 3 runs long, thus, inProgress for 2 of the events
    // this is _confusing_ and should be tidied. you are forewarned!
    // it would make _more_ sense to listen to `runner.events.on('halt')` to
    // detect when the runner completes requests, but that event is _not_
    // bubbled out.  `run:end` serves the same purpose.
    pool.events.on('run:end', () => {
      requestComplete += 1;
      const queueLen = getQueLen();
      if (requestComplete === 1) {
        return t.equal(queueLen, 2, 'two jobs queued');
      } else if (requestComplete === 2) {
        return t.equal(queueLen, 1, 'one jobs queued');
      } else if (requestComplete === 3) {
        return t.equal(queueLen, 0, 'zero jobs queued');
      }
      return t.fail('bogu run:end occurred');
    });
    pool.events.on('queue:end', () => {
      pool.destroy({ deleteDBs: true })
      .then(() => teardownServer())
      .then(() => {
        t.equal(requestComplete, 3, 'three jobs run');
        t.end();
      }, t.end);
    });

    // go.
    pool.init()
    .then(() => {
      pool.triggerRunner(remoteResult1);
      pool.triggerRunner(remoteResult2);
      pool.triggerRunner(remoteResult3);
      t.equal(getQueLen(), 3, 'three jobs queued');
    });
  });
});

test('Pool emits queue and run event activity', (t) => {
  t.plan(8);
  setupServer().then(() => {
    const runId = 'test_run_db_triggers_run';
    const compSeed1 = { _id: `${runId}-testuser1`, username: 'testuser1' };
    const compSeed2 = { _id: `${runId}-testuser2`, username: 'testuser2' };
    const localResult1 = new LocalComputationResult(localResultOpts(compSeed1));
    const localResult2 = new LocalComputationResult(localResultOpts(compSeed2));
    const runner = new LocalPipelineRunner({
      pipeline: pipelines.basic(),
      result: localResult1,
      db: new Pouchy({ name: 'testeventsdb', pouchConfig: { adapter: 'memory' } }),
    });
    const pool = new PipelineRunnerPool(poolUtils.getPoolOpts({ dbRegistry: { isLocal: true } }));
    poolUtils.suppressCreateDestroyHandlers(pool);
    pool.runners[runId] = runner; // stub in the runner
    const confirmStartRunEvents = (result) => {
      if (result === localResult1) { return t.pass('result1 evented'); }
      if (result === localResult2) { return t.pass('result2 evented'); }
      return t.end('bogus event content detected');
    };
    const confirmEndRunEvents = (result) => {
      if (
        result.username === localResult1.username ||
        result.username === localResult2.username
      ) {
        return t.ok(result instanceof ComputationResult, 'ComputationResult emitted');
      }
      return t.end('bogus event content detected');
    };
    pool.events.on('run:start', confirmStartRunEvents);
    pool.events.on('run:end', confirmEndRunEvents);
    pool.events.on('queue:start', qRunId => t.equal(qRunId, runId, 'queue on starts'));
    pool.events.on('queue:end', (qRunId) => {
      t.equal(qRunId, runId, 'queue on ends');
      pool.destroy({ deleteDBs: true })
      .then(() => teardownServer())
      .then(() => t.pass('pool teardown ok'))
      .then(t.end, t.end);
    });
    t.throws(
      () => pool.handleResultChange(),
      /ReferenceError/,
      'ComputationResult instance required'
    );
    pool.init()
    .then(() => {
      pool.handleResultChange(localResult1);
      pool.handleResultChange(localResult2);
    })
    .catch(t.err);
  });
});

test('abstract methods', (t) => {
  t.plan(1);
  const pool = new PipelineRunnerPool(poolUtils.getPoolOpts({ dbRegistry: { isLocal: true } }));
  pool.createNewRunner(null)
  .catch(err => t.ok(err.message.match(/abstract/), 'illegal createNewRunner call'))
  .then(t.end, t.end);
});

test('consortia has DBListeners on pool.init()', (t) => {
  t.plan(2);
  setupServer().then(() => {
    /**
     * add a consortium
     * when the pool inits, it will try to initialize listeners
     * on the consortium because we will set `listenToRemote = true`
     * assert listeners generated per expectation
     */
    let pool;
    const testId = 'testid';
    const dbRegistry = poolUtils.getDBRegistry();
    const dummyConsortium = new Consortium({
      _id: `${testId}`,
      description: 'test-consortium',
      label: 'test-consortium',
      users: [],
      owners: [],
    });
    dbRegistry.get('consortia')
    .save(dummyConsortium.serialize())
    .then(() => {
      pool = new PipelineRunnerPool(poolUtils.getPoolOpts({ dbRegistry: { isLocal: true } }));
      pool.dbRegistry = dbRegistry; // swap seeded registry
      poolUtils.suppressCreateDestroyHandlers(pool);
      pool.listenToRemote = true;
      return pool.init();
    })
    .then(() => {
      const cachedListener = pool.resultsListeners[`remote-consortium-${testId}`];
      t.ok(cachedListener instanceof EventEmitter, 'listener ok');
    })
    .then(() => pool.destroy({ deleteDBs: true }))
    .then(() => teardownServer())
    .then(() => t.pass('pool teardown ok'))
    .then(t.end, t.end);
  });
});

test('pool selectively listens to consortia when using `listenTo`', (t) => {
  /**
   * add a consortium
   * when the pool inits, it will try to initialize listeners
   * on the consortium because we will set `listenToRemote = true`
   * assert that listeners generated per expectation
   */
  t.plan(4);
  setupServer().then(() => {
    let pool;
    const testId1 = 'testid';
    const testId2 = 'testdontlisten';
    const dbRegistry = poolUtils.getDBRegistry();
    const con1 = new Consortium({
      _id: `${testId1}`,
      description: 'test-consortium',
      label: 'test-consortium',
      users: [],
      owners: [],
    });
    const con2 = new Consortium({
      _id: `${testId2}`,
      description: 'test-consortium',
      label: 'test-consortium',
      users: [],
      owners: [],
    });
    const selectiveListenerPoolOpts = poolUtils.getPoolOpts({ dbRegistry: { isLocal: true } });
    selectiveListenerPoolOpts.listenTo = [testId1];
    dbRegistry.get('consortia')
    .save(con1.serialize())
    .then(() => {
      pool = new PipelineRunnerPool(selectiveListenerPoolOpts);
      pool.dbRegistry = dbRegistry; // swap seeded registry
      poolUtils.suppressCreateDestroyHandlers(pool);
      pool.listenToRemote = true;
      return pool.init();
    })
    .then(() => {
      t.ok(
        pool.resultsListeners[`remote-consortium-${testId1}`],
        'listener created on limited listen set'
      );
      t.equals(
        pool._shouldListenToConsortium(con1),
        true,
        'should listen to listenTo consortium'
      );
      t.equals(
        pool._shouldListenToConsortium(con2),
        false,
        'should not listen to non-listenTo consortium'
      );
    })
    .then(() => pool.destroy({ deleteDBs: true }))
    .then(() => teardownServer())
    .then(() => t.pass('pool teardown ok'))
    .then(t.end, t.end);
  });
});

test('getPipelinePlugins', (t) => {
  const hooks = PipelineRunnerPool.getPipelinePlugins({
    comp: { plugins: ['group-step'] },
    env: 'local',
  });
  t.ok(hooks.preRun.length, 'group-step preRun loaded');
  t.equals(hooks.postRun.length, 0, 'no group-step postRun loaded, but [] present');
  t.end();
});
