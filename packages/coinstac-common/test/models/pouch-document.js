'use strict';

const test = require('tape');
const PD = require('../../src/models/pouch-document');

const factory = opts => (new PD(opts));

const validOps = () => {
  return {
    _id: 'testId123',
    _rev: 'testRev123',
  };
};

test('model::pouch-document - constructor', (t) => {
  const pd1 = factory(validOps());
  t.ok(pd1, 'constructs with valid input');
  t.throws(
    () => { pd1._id = 0; },
    /ValidationError/,
    'attr level types enforced (Base test, easier in instance w/ attrs'
  );

  t.throws(
    () => {
      const opts = Object.assign({}, validOps(), { _id: 0 });
      factory(opts);
    }, // typeof _id === string
    Error,
    'errors on incorrectly formatted content - _id'
  );

  t.end();
});
