'use strict';

require('../../../../helpers/boot');
const test = require('tape');
const poolUtils = require('./.test-pool-utils');
const common = require('../../../../../');
const runner = common.models.pipeline.runner;
const computation = common.models.computation;
const RemotePipelineRunnerPool = runner.pool.RemotePipelineRunnerPool;
const RemoteComputationResult = computation.RemoteComputationResult;
const LocalComputationResult = computation.LocalComputationResult;
const assign = require('lodash/assign');

/**
 * @function localResultOpts
 * @description get a functional set of constructor opts for LocalComputationResult
 */
const localResultOpts = (opts) => {
  return assign({
    _id: 'runId-testUser',
    username: 'testUser',
    // computationId - opts must provide!
    // consortiumId - opts must provide!
  }, opts);
};

const setupServer = () => poolUtils.setup();
const teardownServer = () => poolUtils.teardown();

test('builds & execs runners in response to db events', t => {
  t.plan(4);
  setupServer().then(() => {
    const compId = 'test-rrp';

    // create pool instance
    const tPoolOpts = poolUtils.getPoolOpts({ dbRegistry: { isRemote: true } });
    const pool = new RemotePipelineRunnerPool(tPoolOpts);

    // seed random consortium
    const consortium = poolUtils.getDummyConsortium();

    pool.dbRegistry.get('consortia').save(consortium.serialize())
      .then(() => poolUtils.stubBasicComputation(compId))
      .then(() => {
        return pool.dbRegistry.get('computations')
        .put({ _id: compId, name: compId, version: compId });
      })
      .then(() => pool.init())
      .then(() => {
        // generate result, feed to pool ==> kickoff run sequence
        const opts = localResultOpts({
          _id: 'staticRun-testUser',
          computationId: compId,
          consortiumId: consortium._id,
          pipelineState: { step: 0, inProgress: false },
        });
        const localResult = new LocalComputationResult(opts);
        return pool.dbRegistry.get(`local-consortium-${consortium._id}`)
        .save(localResult.serialize());
      })
      .catch(t.end);

    // listen for the run to begin as consequence of seeding a new document
    pool.events.on('run:start', () => t.pass('pipeline run started'));
    pool.events.on('run:end', (result) => {
      t.equal(
        result.data,
        compId,
        [
          'RemotePipelineRunner runs post-LocalComputationResult event',
          result.runId,
        ].join(' ')
      );
    });

    pool.events.on('queue:start', () => t.pass('queue executing on `staticRun`'));
    pool.events.on('queue:end', () => {
      pool.destroy({ deleteDBs: true })
      .then(() => teardownServer())
      .then(() => t.pass('pool tore-down ok'))
      .then(t.end, t.end);
    });
  });
});

test('builds new listeners when new a new consortium is added', t => {
  t.plan(2);
  setupServer().then(() => {
    const consortium = poolUtils.getDummyConsortium();
    const tPoolOpts = poolUtils.getPoolOpts({ dbRegistry: { isRemote: true } });
    const pool = new RemotePipelineRunnerPool(tPoolOpts);
    // assert that listener is generated for new consortium on-add
    const listenerCreatedP = new Promise((res) => {
      pool.events.on('listener:created', (dbname) => {
        t.equal(
          dbname,
          `local-consortium-${consortium._id}`,
          'listener generated dynamically'
        );
        res();
      });
    });
    pool.init()
    .then(() => {
      const rawConsortium = consortium.serialize();
      // do _not_ return save P. we will halt on listenerCreatedP
      pool.dbRegistry.get('consortia').save(rawConsortium);
    })
    .then(() => listenerCreatedP)
    .then(() => pool.destroy({ deleteDBs: true }))
    .then(() => teardownServer())
    .then(() => t.pass('teardown ok'))
    .then(t.end, t.end);
  });
});

test('fetch or seed computation results on init', (t) => {
  t.plan(3);
  setupServer().then(() => {
    const tPoolOpts = poolUtils.getPoolOpts({ dbRegistry: { isRemote: true } });
    const pool = new RemotePipelineRunnerPool(tPoolOpts);
    const resultDB = pool.dbRegistry.get('remote-consortium-abc');
    const remoteResult = poolUtils.getDummyRemoteResult();

    // seed a result
    return resultDB.save(remoteResult.serialize())
    .then(() => pool.init())
    // fetch latest result, just seeded
    .then(() => pool.getLatestResult(resultDB, remoteResult.runId))
    .then((rslt) => t.ok(
      rslt instanceof RemoteComputationResult,
      'can fetch latest remote computation result'
    ))
    // fetch it again using higher level method (albeit this one will also
    // instantiate a result if none found--tested in integration)
    // @note really, we shoul be passing a local result ¯\_(LOC)_/¯
    .then(() => pool.getRemoteResult(resultDB, remoteResult))
    .then((rslt) => t.ok(
      rslt instanceof RemoteComputationResult,
      'can fetch latest remote computation result'
    ))
    .then(() => pool.destroy({ deleteDBs: true }))
    .then(() => teardownServer())
    .then(() => t.pass('teardown ok'))
    .then(t.end, t.end);
  });
});

test('marks completed computations', t => {
  t.plan(3);

  const consortiumId = 'abc';
  const runId = 'runId';

  setupServer().then(() => {
    const pool = new RemotePipelineRunnerPool(
      poolUtils.getPoolOpts({ dbRegistry: { isRemote: true } })
    );
    const resultDB = pool.dbRegistry.get(`remote-consortium-${consortiumId}`);
    const remoteResult = poolUtils.getDummyRemoteResult();

    pool.events.on('computation:markedComplete', () => {
      resultDB.get(runId).then(
        doc => {
          t.ok(
            typeof doc.endDate === 'number' &&
            Date.now() - doc.endDate < 200,
            'sets end date'
          );
          t.equal(doc.complete, true, 'sets "completed" to true');
        },
        error => {
          throw error;
        }
      );
    });

    return resultDB.save(remoteResult.serialize())
      .then(pool.init())
      .then(() => {
        pool.events.emit('computation:complete', runId, consortiumId);
      })
      .then(() => pool.destroy({ deleteDBs: true }))
      .then(() => teardownServer())
      .then(() => t.pass('teardown ok'))
      .then(t.end, t.end);
  });
});
