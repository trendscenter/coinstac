'use strict';

const assign = require('lodash/assign');
const test = require('tape');
const {
  models: {
    computation: { RemoteComputationResult },
  },
} = require('../../../');

const genOpts = (opts) => {
  return assign({}, {
    _id: 'dummyRunId',
    usernames: ['testLocalUser'],
    computationId: 'test-computation-id',
    consortiumId: 'testconsortium',
    computationInputs: [[
      ['TotalGrayVol'],
      200,
    ]],
  }, opts);
};

test('constructor - runId', (t) => {
  const wildRunId = '!@$#(&ABC)_!~\\]';
  const validOpts = genOpts();
  const invalidOpts = genOpts({ _id: `${wildRunId}-garbage` });

  // test valid
  try {
    const result = new RemoteComputationResult(validOpts); // eslint-disable-line no-unused-vars
    t.pass('valid constructor options ok');
    t.pass(
      typeof result.startDate === 'number'
      && Date.now() - result.startDate < 100,
      'sets start date'
    );
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
