'use strict';

const assign = require('lodash/assign');
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
  const validOpts = genOpts();
  const validWildOpts = genOpts({ _id: `${wildRunId}-username` });
  const invalidWildOpts1 = genOpts({
    _id: `${wildRunId}-username-bogus`, // excess -suffix
  });
  const invalidWildOpts2 = genOpts({ _id: wildRunId }); // no username

  // test valid
  try {
    /* eslint-disable no-unused-vars */
    const result1 = new LocalComputationResult(validOpts);
    const result2 = new LocalComputationResult(validWildOpts);
    /* eslint-enable no-unused-vars */
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
