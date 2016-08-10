'use strict';

require('../pipeline/.test-pipelines');

const assign = require('lodash/assign');
const computations = require('../../../').models.computation;
const ComputationResult = computations.ComputationResult;
const test = require('tape');

const genOpts = (opts) => {
  return assign({}, {
    _id: 'dummyRunId-testLocalUsername',
    computationId: 'test-computation-id',
    consortiumId: 'testconsortiumid',
  }, opts);
};

test('constructor - basic', t => {
  const minFullOptsPatch = {
    data: 'a',
    history: [],
    pipelineState: { step: 0, inProgress: false },
  };
  const richFullOptsPatch = {
    data: { a: ['b'] },
    history: ['c', 'd'],
    pipelineState: { step: 1, inProgress: true },
  };
  const errorOptsPatch1 = { history: {} };
  const errorOptsPatch2 = { pipelineState: null };

  t.ok(
        new ComputationResult(genOpts(minFullOptsPatch)),
        'fully loaded ComputationResult ok, 1'
    );
  t.ok(
        new ComputationResult(genOpts(richFullOptsPatch)),
        'fully loaded ComputationResult ok, 2'
    );
  t.throws(
        () => (new ComputationResult(genOpts(errorOptsPatch1))),
        'bogus data rejected (.history)'
    );
  t.throws(
        () => (new ComputationResult(genOpts(errorOptsPatch2))),
        'bogus data rejected (.pipeline)'
    );
  t.end();
});

test('constructor - deny runId set', t => {
  t.throws(
    () => {
      const result = new ComputationResult(genOpts());
      result.runId = 'error now!';
    },
    /Error/,
    'forbids setting of runId'
  );
  t.end();
});
