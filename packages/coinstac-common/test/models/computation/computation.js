'use strict';

const _ = require('lodash');
const test = require('tape');
const {
  models: {
    computation,
    computation: { Computation },
  },
} = require('../../../');

test('model::Computation', (t) => {
  t.throws(() => {
    return new Computation();
  }, /Validation/, 'throws without type');

  t.throws(() => {
    const comp = new Computation({ type: 'xyz', cwd: __dirname });
    comp.run();
  }, /abstract/, 'throws indicating Computation is an abstract type');

  t.end();
});

test('model::Computation.factory', (t) => {
  let comps = Computation.factory({
    type: 'function',
    fn(opts) {}, // eslint-disable-line no-unused-vars
    cwd: __dirname,
  });

  t.ok(_.isArray(comps), 'computations generated from single, raw comp');
  comps = Computation.factory([
    {
      type: 'function',
      fn(opts) {}, // eslint-disable-line no-unused-vars
      cwd: __dirname,
    },
    { type: 'cmd', cmd: 'test-command', cwd: './test-dir' },
  ]);
  t.ok(_.isArray(comps), 'computations generated from arr of raw comps');
  t.ok(comps[0] instanceof computation.JavascriptComputation, 'subtypes generated');

  t.ok(_.isArray(comps), 'computations generated from single, raw comp');
  t.throws(
    () => Computation.factory({}),
    /ReferenceError/,
    'errors when invalid raw computation set requested'
  );
  t.end();
});
