'use strict';
const _ = require('lodash');
const path = require('path');
const computations = require('../../../').models.computation;
const CommandComputation = computations.CommandComputation;
const test = require('tape');

test('model::CommandComputation constructor', function (t) {
  t.throws(function () {
    const comp = new CommandComputation({ type: 'function' });
  }, /cmd/, 'requires type: "cmd"');

  t.throws(function () {
    const comp = new CommandComputation({ type: 'cmd', cmd: 'test' });
  }, /cwd/, 'throws without cwd');

  t.end();
});

test('model::CommandComputation run (args passed to file)', function (t) {
  t.plan(1);
  const runInputs = { filenames: ['/dummy/path'] };
  const comp = new CommandComputation({
    cwd: __dirname,
    type: 'cmd',
    cmd: 'node',
    args: ['./test-command-inputs.js'],
    verbose: true,
  });
  comp.run(runInputs)
  .then((rslt) => {
    t.deepEqual(rslt, runInputs, 'inputs in === inputs out');
    t.end();
  }, t.end);
});

test('model::CommandComputation run (basic, from command line)', function (t) {
  t.plan(1);
  const comp = new CommandComputation({
    cwd: __dirname,
    type: 'cmd',
    cmd: 'python',
    args: ['-c', 'import json; print json.dumps({ "foo": "bar" });'],
  });
  comp.run()
  .then((rslt) => {
    t.deepEqual(rslt, { foo: 'bar' }, 'computation result passed per expectation');
    t.end();
  }, t.end);
});

test('model::CommandComputation run (basic, from file)', function (t) {
  t.plan(1);
  const comp = new CommandComputation({
    cwd: __dirname,
    type: 'cmd',
    cmd: 'python',
    args: ['test-command-good.py'],
  });
  comp.run()
  .then((rslt) => {
    t.deepEqual(rslt, { bar: 'baz' }, 'computation handles file stdout results');
    t.end();
  }, t.end);
});

test('model::CommandComputation run fail (basic, invalid cmd)', function (t) {
  t.plan(1);
  const comp = new CommandComputation({
    cwd: __dirname,
    type: 'cmd',
    cmd: 'bogus',
    args: ['bargus.py'],
  });
  comp.run()
  .then(() => t.end('computation should have failed'))
  .catch(() => {
    t.ok('handled invalid command');
    return t.end();
  });
});

test('model::CommandComputation run fail (basic, invalid syntax)', function (t) {
  t.plan(1);
  const comp = new CommandComputation({
    cwd: __dirname,
    type: 'cmd',
    cmd: 'python',
    args: ['test-command-bad-syntax.py'],
  });
  comp.run()
  .then(() => t.end('computation should have failed'))
  .catch(() => {
    t.ok('handled bad syntax');
    return t.end();
  });
});

test('model::CommandComputation run fail (basic, file throws Exception)', function (t) {
  t.plan(1);
  const comp = new CommandComputation({
    cwd: __dirname,
    type: 'cmd',
    cmd: 'python',
    args: ['test-command-bad-exception.py'],
  });
  comp.run()
  .then(() => t.end('computation should have failed'))
  .catch(() => {
    t.ok('handled exception');
    return t.end();
  });
});

test('model::CommandComputation run fail (invalid return)', function (t) {
  t.plan(1);
  const comp = new CommandComputation({
    cwd: __dirname,
    type: 'cmd',
    cmd: 'node',
    args: ['test-error-bad-json.js'],
  });
  comp.run()
  .then(() => t.end('computation should have failed'))
  .catch(() => {
    t.ok('handle invalid json error');
    return t.end();
  });
});
