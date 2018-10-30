'use strict';

require('../../helpers/boot');
const test = require('tape');
const { models: { pipeline: { Pipeline } } } = require('../../../');

const pipelines = require('./.test-pipelines');

test('model::Pipeline constructor - basics', (t) => {
  t.throws(
    () => new Pipeline(),
    /ValidationError/,
    'constructor attrs present'
  );
  t.throws(
    () => new Pipeline({ computations: [] }),
    /ValidationError/,
    '1+ computation required'
  );
  const p = pipelines.basic();
  t.equal(p.inProgress, false, 'inProgress defaults without explicit set');
  t.equal(p.step, 0, 'step defaults without explicit set');
  t.end();
});

test('model::Pipeline run - basic (single, `run` error)', (t) => {
  t.plan(2);
  const p = pipelines.basicError();

  p.run({}, {})
    .catch((err) => {
      t.ok(err instanceof Error, 'run error propogated, p1');
      t.ok(err.message.match('test-run-error'), 'run error propogated, p2');
      t.end();
    });
});

test('model::Pipeline run - basic (single comp, error, invalid opts)', (t) => {
  t.plan(1);
  const p = pipelines.basic();
  p.run(null, {})
    .then(() => t.end('should error without `run` opts'))
    .catch((err) => {
      t.ok(err instanceof Error, 'errors without `run` opts');
      t.end();
    });
});

test('model::Pipeline run - basic (forbid parallel running)', (t) => {
  t.plan(2);
  const p = pipelines.basicAsync();
  p.run({ async: 'is-happening-now, baby' }, {})
    .catch(() => t.end('should error without `run` opts'));
  p.run({}, {})
    .then(() => t.end('should error when running pipeline instance .run concurrently'))
    .catch((err) => {
      t.ok(err instanceof Error, 'concurrent pipeline running forbidden');
      t.ok(
        err.message.match(/concurrency/),
        'inProgress error explains concurrency'
      );
      return t.end();
    });
});

test('model::Pipeline run - basic (single)', (t) => {
  t.plan(2);
  const p = pipelines.basic();
  const serial = p.serialize();
  t.notOk(serial.computations, 'computations not serialized');
  p.run({}, {})
    .then(rslt => t.equal(rslt, 0, 'basic run returns computation result'))
    .then(t.end, t.end);
});

test('model::Pipeline run - basic (double, immediate stepping w/out next)', (t) => {
  let calledFirst;
  t.plan(6);
  const p = pipelines.basicDouble();
  p.events.on('save-request', (rslt) => {
    if (!calledFirst) {
      calledFirst = true;
      t.equal(1, rslt, 'first cb has first result');
      t.equal(p.step, 1, 'pipeline has progressed');
      t.ok(p.inProgress, 'pipeline shows in progress');
      return;
    }
    t.equal(2, rslt, 'second cb has second result using result from prior `run`');
    t.equal(p.step, 1, 'pipeline has not progressed passed final step');
    t.notOk(p.inProgress, 'pipeline not in progress when not proceeding');
    t.end();
  });
  p.run({}, {})
    .catch(t.end);
});

test('model::Pipeline run - basic (double, immediate stepping w/ next)', (t) => {
  let calledFirst;
  t.plan(2);
  const p = pipelines.basicDoubleNext();
  p.events.on('save-request', (rslt) => {
    if (!calledFirst) {
      calledFirst = true;
      return;
    }
    t.equal(2, rslt, 'second cb has second result');
    t.notOk(p.inProgress, 'pipeline not in progress when not proceeding');
    t.end();
  });
  p.run({}, {})
    .catch(err => t.end(err && err.message));
});

test('model::Pipeline maybeIncrementStep - basic (double, `next` errors pre-run)', (t) => {
  const p = pipelines.invalidOptsNextPreRunError();
  t.plan(2);
  p.run({}, {})
    .then(() => t.end('error should have occurred'))
    .catch((err) => {
      t.ok(err instanceof Error, '`next` errors propogated, p1');
      t.ok(err.message.match(/test-next-error-pre-run/), '`next` errors propogated, p2');
      t.end();
    });
});

test('model::Pipeline maybeIncrementStep - basic (double, `next` errors post-run)', (t) => {
  const p = pipelines.invalidOptsNextPostRunError();
  t.plan(2);
  p.run({}, {})
    .then(() => t.end('error should have occurred'))
    .catch((err) => { // eslint-disable-line
      t.ok(err instanceof Error, '`next` errors propogated post-run, p1');
      t.ok(
        err.message.match(/test-next-post-run-error/),
        '`next` errors propogated post-run, p2'
      );
      t.end();
    });
});

test('model::Pipeline run - intermediate (double, user event stepping)', (t) => {
  t.plan(4);
  const p = pipelines.userTriggeredStepping();
  p.run({}, {})
    .then((rslt) => {
      t.equal(p.step, 0, 'pipeline does not progress when `next` returns falsy');
      t.equal(rslt, 1, 'result correct even when user does not trigger `next`');

      // simulate async activity, like responding to network events from dbs
      setTimeout(() => {
        p.run({ proceed: true }, {})
          .then((rslt) => {
            t.equal(p.step, 1, 'pipeline steps after user intent triggers `next`');
            t.equal(rslt, 2, 'result is as expected after user triggers pipeline `next`');
            t.end();
          }, t.end);
      }, 1);
    }, t.end);
});
