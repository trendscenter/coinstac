'use strict';

require('../../../helpers/boot');
const common = require('../../../../');
const test = require('tape');
const runnerUtils = require('./.test-runner-utils');
const RemotePipelineRunner = common.models.pipeline.runner.RemotePipelineRunner;
const cloneDeep = require('lodash/cloneDeep');

test('RemotePipelineRunner::constructor', t => {
  const runner = new RemotePipelineRunner(runnerUtils.remoteOpts());
  t.ok(runner instanceof RemotePipelineRunner, 'basic instantiation ok');
  t.end();
});

test('RemotePipelineRunner::run - basic', t => {
  const opts = runnerUtils.remoteOpts();
  const runner = new RemotePipelineRunner(opts);
  const localResult = runnerUtils.getLocalResult();
  t.plan(5);

  // seed user results db with a result
  runner.localDB.save(localResult.serialize())
  .then((doc) => { localResult._rev = doc._rev; })
  // run, then assert runner state is per expectation
  .then(() => runner.run(localResult))
  .then((result) => {
    t.ok(result.pipelineState, 'serialized pipeline state persists');
    t.equal(runner.userResultState.length, 1, 'user results state cached');
    t.deepEqual(
      runner.userResultState[0],
      { _id: localResult._id, _rev: localResult._rev },
      'user state updated ok, composed of _id, _rev'
    );
  })
  // assert userResultState not updated, and duplicate pipeline run
  // has been prevented (reduce friv computation runs)
  .then(() => {
    const prevUserResultState = cloneDeep(runner.userResultState);
    const pipelineRunStub = () => {
      // sinon stub is freaking out, so self-stub
      pipelineRunStub.called = true;
      runner.pipeline.run.apply(runner.pipeline, arguments);
    };
    runner.pipeline.run = pipelineRunStub;
    runner.events.on('noop:noStateChange', () => {
      t.deepEqual(
        runner.userResultState,
        prevUserResultState,
        'result states match'
      );
      t.notOk(
        pipelineRunStub.called,
        'pipeline _not_ re-run when results user results unchanged'
      );
      t.end();
    });
    return runner.run(localResult);
  })
  .catch(t.end);
});

test('RemotePipelineRunner::run - basic - input errors', t => {
  const runner = new RemotePipelineRunner(runnerUtils.remoteOpts());
  t.plan(1);
  runner.events.on('error', (err) => {
    t.ok(err.message, 'errors without local result');
  });
  runner.run(null);
  t.end();
});

test('RemotePipelineRunner::run - basic - bogus pipeline handling', (t) => {
  t.plan(2);
  const runner = new RemotePipelineRunner(runnerUtils.remoteOpts());
  runner.pipeline = runnerUtils.getBustedPipeline();
  const localResult = runnerUtils.getLocalResult();
  runner.events.on('halt', (doc) => {
    t.ok(doc.error.message.match(/test-error/), 'pipeline errors propogated');
    t.end();
  });
  runner.events.on('error', () => t.pass('error event emitted'));
  runner.run(localResult).catch(t.end);
});

test('propogate user errors via remote `userErrors` aggregation', (t) => {
  t.plan(2);
  const runId = 'runId';

  // prep runner and localResult to feed to runner.
  let stubbedLocalDocs = [];
  const runner = new RemotePipelineRunner(runnerUtils.remoteOpts());
  runner.result._id = `${runId}`;
  runner.pipeline = runnerUtils.getPipeline();
  const localResult = runnerUtils.getLocalResult();
  localResult._id = localResult._rev = `${runId}-old`;
  localResult.error = { test: 1 };

  // stub in local result query so we can skip db calls.
  runner.getResultDocs = () => stubbedLocalDocs;
  stubbedLocalDocs.push(localResult.serialize());

  // assert RemoteComputationResult has proper `userErrors` state on halt.
  runner.events.on('halt', (doc) => {
    const errors = doc.userErrors;
    // on first halt, expect one user error
    if (errors && errors.length === 1) {
      t.equals(errors.length, 1, 'user errors propogated');

      // cool. now clear the error, update the db stub, and run it again!
      delete localResult.error;
      localResult._id = localResult._rev = 'runId-new';
      stubbedLocalDocs = [localResult.serialize()];
      return runner.run(localResult).catch(t.end);
    }
    // on second halt, expect error to be cleared.
    t.equals(errors.length, 0, 'errors cleared when users are non-erroring');
    return t.end();
  });
  runner.events.on('error', () => t.fail('error event emitted'));

  // go.
  runner.run(localResult).catch(t.end);
});
