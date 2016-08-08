'use strict';

const computations = require('../../../').models.computation;
const JavascriptComputation = computations.JavascriptComputation;
const test = require('tape');

test('model::JavascriptComputation constructor', t => {
  t.throws(() => {
    return new JavascriptComputation({ type: 't =>' });
  }, /Validation/, 'throws without fn');

  t.end();
});

test('model::JavascriptComputation run (basic-1)', t => {
  t.plan(1);
  const comp = new JavascriptComputation({
    type: 't =>',
    fn: (opts) => Promise.resolve(12345), // eslint-disable-line no-unused-vars
    cwd: __dirname,
  });
  comp.run()
  .then((rslt) => t.equal(12345, rslt, 'computation result passed per expectation'))
  .then(t.end, t.end);
});

test('model::JavascriptComputation run (basic-2)', t => {
  t.plan(1);
  const comp = new JavascriptComputation({
    type: 't =>',
    fn: (opts) => Promise.resolve(opts.definition.seed + 1),
    cwd: __dirname,
  });
  comp.run({ definition: { seed: 1 } })
  .then((rslt) => t.equal(rslt, 2, 'computation inputs passed per expectation'))
  .then(t.end, t.end);
});
