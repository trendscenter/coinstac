'use strict';
const _ = require('lodash');
const path = require('path');
const computations = require('../../../').models.computation;
const JavascriptComputation = computations.JavascriptComputation;
const test = require('tape');

test('model::JavascriptComputation constructor', function (t) {
  t.throws(function () {
    const comp = new JavascriptComputation({ type: 'function' });
  }, /Validation/, 'throws without fn');

  t.end();
});

test('model::JavascriptComputation run (basic-1)', function (t) {
  t.plan(1);
  const comp = new JavascriptComputation({
    type: 'function',
    fn: (opts) => Promise.resolve(12345),
    cwd: __dirname,
  });
  comp.run()
  .then((rslt) => t.equal(12345, rslt, 'computation result passed per expectation'))
  .then(t.end, t.end);
});

test('model::JavascriptComputation run (basic-2)', function (t) {
  t.plan(1);
  const comp = new JavascriptComputation({
    type: 'function',
    fn: (opts) => Promise.resolve(opts.definition.seed + 1),
    cwd: __dirname,
  });
  comp.run({ definition: { seed: 1 } })
  .then((rslt) => t.equal(rslt, 2, 'computation inputs passed per expectation'))
  .then(t.end, t.end);
});
