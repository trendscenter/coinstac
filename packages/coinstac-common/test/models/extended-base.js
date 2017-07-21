'use strict';

const Base = require('../../src/models/base.js');
const test = require('tape');
const joi = require('joi');
const sinon = require('sinon');

class ExtendedBase extends Base {
}

ExtendedBase.schema = Object.assign({
  testField: joi.string().min(2), // not required as it is derived
  dummyField: joi.string().min(1).required(),
}, Base.schema);

class SuuuuuperExtendedBase extends ExtendedBase {
}

SuuuuuperExtendedBase.schema = Object.assign({
  extendedBase: joi.object().type(ExtendedBase),
}, ExtendedBase.schema);

test('model::base - extended class', (t) => {
  t.throws(
    () => new ExtendedBase(),
    Error,
    'schema validated using base.prototype.validate'
  );

  let extbm = new ExtendedBase({ dummyField: 'abc' });
  t.ok(extbm, 'constructs with valid input');

    // test serialize/toJSON with full attrs
  let dummyAttrs = { dummyField: 'xyz', testField: '12' };
  extbm = new ExtendedBase(dummyAttrs);
  t.deepEquals(
        dummyAttrs,
        extbm.serialize(),
        'base serialize ok (only schema attrs copied) (full attr set)'
    );
  t.deepEquals(
        dummyAttrs,
        extbm.toJSON(),
        'base .toJSON ok (full attr set)'
    );

  // test serialize/toJSON with incomplete but valid attrs
  dummyAttrs = { dummyField: 'xyz' };
  extbm = new ExtendedBase(dummyAttrs);
  t.deepEquals(
    dummyAttrs,
    extbm.serialize(),
    'base serialize ok (only schema attrs copied) (incomplete attr set)'
  );

  const suuuper = new SuuuuuperExtendedBase({
    extendedBase: extbm,
    dummyField: 'abcdef',
  });
  let testSerialized = extbm.serialize();
  testSerialized = { dummyField: 'abcdef', extendedBase: testSerialized };

  t.deepEquals(
    suuuper.serialize(),
    testSerialized,
    'nested model serialization'
  );

  extbm = new ExtendedBase(dummyAttrs);
  sinon.spy(extbm, '_validate');
  extbm.testField = 'setting-to-string-which-will-be-validated';
  t.ok(extbm._validate.calledOnce, 'field validation called on change');
  t.deepEquals(
    { testField: 'setting-to-string-which-will-be-validated' },
    extbm._validate.getCall(0).args[0],
    [
      'called with partial model values, { attrKey: attrValue }',
      'when validating only fields',
    ].join(' ')
    );
  t.deepEquals(
    { fields: true },
    extbm._validate.getCall(0).args[1],
    'called with { field: true } to validate only fields'
  );

  // delete field GASP
  extbm._validate.restore();

  t.end();
});
