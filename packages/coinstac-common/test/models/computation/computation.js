'use strict';
const _ = require('lodash');
const path = require('path');
const computations = require('../../../').models.computation;
const Computation = computations.Computation;
const test = require('tape');

test('model::Computation', function (t) {
  t.throws(function () {
    const comp = new Computation();
  }, /Validation/, 'throws without type');

  t.throws(function () {
    const comp = new Computation({ type: 'xyz', cwd: __dirname });
    comp.run();
  }, /abstract/, 'throws indicating Computation is an abstract type');

  t.end();
});

test('model::Computation.factory', function (t) {
  let comps = Computation.factory({
    type: 'function',
    fn: function (opts) {},
    cwd: __dirname,
  });

  t.ok(_.isArray(comps), 'computations generated from single, raw comp');
  comps = Computation.factory([
        { type: 'function', fn: function (opts) {}, cwd: __dirname },
        { type: 'cmd', cmd: 'test-command', cwd: './test-dir' },
  ]);
  t.ok(_.isArray(comps), 'computations generated from arr of raw comps');
  t.ok(comps[0] instanceof computations.JavascriptComputation, 'subtypes generated');

  t.ok(_.isArray(comps), 'computations generated from single, raw comp');
  t.throws(
        () => Computation.factory({}),
        /ReferenceError/,
        'errors when invalid raw computation set requested'
    );
  t.end();
});
