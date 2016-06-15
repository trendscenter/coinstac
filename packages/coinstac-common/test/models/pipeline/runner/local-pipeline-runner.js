'use strict';

require('../../../helpers/boot');
const common = require('../../../../');
const test = require('tape');
const runnerUtils = require('./.test-runner-utils');
const LocalPipelineRunner = common.models.pipeline.runner.LocalPipelineRunner;
const noop = require('lodash/noop');

test('LocalPipelineRunner constructor - basic', t => {
  let runner = new LocalPipelineRunner(runnerUtils.localOpts());
  t.ok(runner instanceof LocalPipelineRunner, 'basic instantiation ok');
  t.end();
});

test('LocalPipelineRunner run - basic', t => {
  let runner = new LocalPipelineRunner(runnerUtils.localOpts());
  let remoteResult = runnerUtils.getRemoteResult();
  t.plan(4);
  runner.run(remoteResult);
  runner.events.on('halt', (result) => {
    t.ok(result.pipelineState, 'serialized pipeline state persists');
    // @note localOpts stubs the pipeline's single comp result
    // to ._result
    t.deepEqual(
      result.data,
      runner.pipeline._result,
      'computation result stashed to `.data`'
    );
    runner.db.all((err, docs) => {
      if (err) { return t.end(err.message); }
      t.deepEqual(docs[0], result.serialize(), 'result persisted');
      t.equal(docs.length, 1, 'exactly one result persisted');
      t.end();
    });
  });
});

test('run - basic - input errors', t => {
  let runner = new LocalPipelineRunner(runnerUtils.localOpts());
  let remoteResult = runnerUtils.getRemoteResult();
  remoteResult.complete = true;

  const _handleNoInput = (err) => t.ok(err.message, 'errors without remote result');
  runner.events.on('error', _handleNoInput);
  runner.run().catch(noop);
  runner.events.removeListener('error', _handleNoInput);

  const _handleCompleteResultAsInput = (err) => {
    t.ok(
      err.message.match(/complete/),
      'errors when remote result completed'
    );
  };
  runner.events.on('error', _handleCompleteResultAsInput);
  runner.run(remoteResult).catch(noop);
  runner.events.removeListener('error', _handleCompleteResultAsInput);
  t.end();
});

test('run - basic - bogus pipeline handling', t => {
  t.plan(2);
  let runner = new LocalPipelineRunner(runnerUtils.localOpts());
  runner.pipeline = runnerUtils.getBustedPipeline();
  let remoteResult = runnerUtils.getRemoteResult();
  runner.events.on('error', () => t.pass('runner error on bogus pipeline'));
  runner.events.on('halt', (result) => {
    t.ok(result.error.message.match(/test-error/), 'pipeline errors propogated');
  });
  runner.run(remoteResult)
  .catch((err) => {
    t.ok(result.error.message.match(/test-error/), 'pipeline errors rejected via runner');
    t.end();
  });
});
