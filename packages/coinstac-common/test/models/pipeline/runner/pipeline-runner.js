'use strict';

require('../../../helpers/boot');
const runnerUtils = require('./.test-runner-utils');
const common = require('../../../../');
const test = require('tape');
const Runner = common.models.pipeline.runner.PipelineRunner;

test('constructor - basic', t => {
  let runner = new Runner(runnerUtils.basicOpts());
  t.throws(() => new Runner(), /Error/, 'requires min attrs');
  t.throws(() => runner.run(), /ReferenceError/, 'run must be extended');
  t.end();
});

test('saveResult - basic', t => {
  let runner = new Runner(runnerUtils.basicOpts());
  const db = runnerUtils.getDB('testdb'); // use for local and remote
  t.plan(3);
  runner.saveResult(db, { bananas: 1 })
  .then(() => db.all().then((docs) => docs[0]))
  .then((doc) => {
    t.ok(doc.pipelineState, 'serialized pipeline state persists');
    t.deepEqual(doc.data, { bananas: 1 }, 'computation result stashed to `.data`');
  })
  .then(() => db.destroy())
  .then(() => t.pass('db destroyed'))
  .then(() => t.end(), t.end);
});

test('saveResult - basic - noop\'s on empty save', t => {
  let runner = new Runner(runnerUtils.basicOpts());
  const db = runnerUtils.getDB('testdb'); // use for local and remote
  t.plan(2);
  runner.saveResult(db, null, null)
  .then(() => {
    return new Promise((res) => {
      runner.events.on('noop:noData', res);
      runner.saveResult(db, null, null);
    });
  })
  .then(() => t.pass('noop:noData occurs when computation saves empty result'))
  .then(() => db.destroy())
  .then(() => t.pass('db destroyed'))
  .then(() => t.end(), t.end);
});

test('saveResult - basic - error', t => {
  let runner = new Runner(runnerUtils.basicOpts());
  const db = runnerUtils.getDB('no_seed_result_db');
  t.plan(2);
  runner.hasPersistedResult = true; // <==  we did _actually_ not persist a result doc yet
  runner.events.on('error', (err) => {
    if (!err) {
      return t.end([
        'should error attempting to persist result data without',
        'an available result document',
      ].join(' '));
    }
    t.ok(err instanceof ReferenceError, 'errors without result doc to patch');
    return null;
  });
  runner.saveResult(db, { bananas: 2 })
  .catch(() => t.pass('rejected on error'))
  .then(t.end, t.end);
});

test('saveResult - queue simultaneous saves, history OK', t => {
  const runner = new Runner(runnerUtils.basicOpts());
  const db = runnerUtils.getDB('history_test_db');
  t.plan(5);
  Promise.resolve()
  .then(() => runner.saveResult(db, { first: 1 }))
  .then(() => db.all().then((docs) => docs[0]))
  .then((doc) => {
    t.notOk(doc.history.length, 'no history after first save');
    t.equal(doc.data.first, 1, 'first-to-queue data saved on concurrent save request');
  })
  .then(() => runner.saveResult(db, { second: 2 }))
  .then(() => db.all().then((docs) => docs[0]))
  .then((doc) => {
    t.equal(doc.history.length, 1, 'history maintained');
    t.deepEqual(doc.history, [{ first: 1 }]);
    t.deepEqual(doc.data, { second: 2 });
  })
  .then(t.end, t.end);
});

test('getPreviousResultData', t => {
  const runnerOpts = runnerUtils.basicOpts();
  const db = runnerUtils.getDB('prev_results_db');
  const toAdd = { bananas: 1 };
  let runner = new Runner(runnerOpts);
  t.plan(2);

  const hasNoPrevResultPreAdd = () => {
    return runner.getPreviousResultData(db)
    .then((prev) => t.notOk(prev, 'has no prev result'))
    .catch(t.end);
  };

  const addResult = () => runner.saveResult(db, toAdd);

  const hasPrevResult = () => {
    return runner.getPreviousResultData(db)
    .then((prev) => t.deepEqual(prev, toAdd, 'has prev result'))
    .catch(t.end);
  };

  hasNoPrevResultPreAdd()
  .then(addResult)
  .then(hasPrevResult)
  .then(t.end, t.end);
});
