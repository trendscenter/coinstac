'use strict';
const assign = require('lodash/assign');
const computations = require('../../../').models.computation;
const RemoteComputationResult = computations.RemoteComputationResult;
const test = require('tape');

const genOpts = (opts) => {
  return assign({}, {
    _id: 'dummyRunId',
    usernames: ['testLocalUser'],
    computationId: 'test-computation-id',
    consortiumId: 'testconsortium',
  }, opts);
};

test('constructor - runId', (t) => {
  const wildRunId = '!@$#(&ABC)_!~\\]';
  let validOpts = genOpts();
  let invalidOpts = genOpts({ _id: wildRunId + '-garbage' });
  let result;

    // test valid
  try {
    result = new RemoteComputationResult(validOpts);
    t.pass('valid constructor options ok');
  } catch (err) {
    return t.end(err.message);
  }

    // test invalid
  t.throws(
    () => (new RemoteComputationResult(invalidOpts)),
    /Error/,
    'errors on bogus -suffix trailing content'
  );

  return t.end();
});
