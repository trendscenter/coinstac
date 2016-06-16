'use strict';

const assign = require('lodash/assign');
const path = require('path');
const computations = require('../../../').models.computation;
const LocalComputationResult = computations.LocalComputationResult;
const test = require('tape');

const genOpts = (opts) => {
  return assign({}, {
    _id: 'dummyRunId-testLocalUsername',
    username: 'testUser',
    consortiumId: 'test-consortium',
    computationId: 'test-computation-id',
  }, opts);
};

test('constructor - runId', (t) => {
  const wildRunId = '!@$#(&ABC)_!~\\]';
  let validOpts = genOpts();
  let validWildOpts = genOpts({ _id: wildRunId + '-username' });
  let invalidWildOpts1 = genOpts({
    _id: wildRunId + '-username-bogus', // excess -suffix
  });
  let invalidWildOpts2 = genOpts({ _id: wildRunId }); // no username
  let result;

    // test valid
  try {
    result = new LocalComputationResult(validOpts);
    result = new LocalComputationResult(validWildOpts);
    t.pass('valid constructor options ok');
  } catch (err) {
    return t.end(err.message);
  }

  // test invalid
  t.throws(
    () => (new LocalComputationResult(invalidWildOpts1)),
    /Error/,
    'errors on bogus -suffix trailing username'
  );
  t.throws(
    () => (new LocalComputationResult(invalidWildOpts2)),
    /Error/,
    'errors on missing username'
  );

  return t.end();
});
