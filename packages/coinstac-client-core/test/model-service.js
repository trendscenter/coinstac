'use strict';

const BaseModel = require('coinstac-common').models.Base;
const ModelService = require('../src/model-service.js');
const sinon = require('sinon');
const test = require('tape');

class DummyModel extends BaseModel {}

class Dummy extends ModelService {
  modelServiceHooks() { // eslint-disable-line class-methods-use-this
    return {
      dbName: 'test-db-name',
      ModelType: DummyModel,
    };
  }
}

Dummy.test = 'testing';

function dummyFactory() {
  return new Dummy({ dbRegistry: {}, client: {} });
}

test('ModelService basic', (t) => {
  t.ok(ModelService instanceof Function, 'ModelService is fn');
  t.throws(() => new ModelService(), 'explodes without content');
  t.end();
});

test('ModelService extension', (t) => {
  const d = dummyFactory();
  t.ok(d, 'extension GO!');
  t.end();
});

test('ModelService validation params', (t) => {
  const dummy = dummyFactory();
  const validateSpy = sinon.stub(BaseModel.prototype, '_validate');

  t.plan(3);

  dummy.validate()
    .then(() => t.fail('shouldn’t validate without parameters'))
    .catch(() => t.pass('rejects without parameters'));

  dummy.validate({ wat: 'wat' })
    .then(() => {
      t.pass('passes callback param');

      return dummy.validate({ wat: 'wat' }, false);
    })
    .then(() => {
      t.notOk(validateSpy.lastCall.args[0].fields, 'passes onlyFields param');
      validateSpy.restore();
    })
    .catch(t.end);
});

test('ModelService validation', (t) => {
  const dummy = dummyFactory();
  const props = {
    my: 'random',
    properties: 'to validate',
  };
  const validateStub = sinon.stub(BaseModel.prototype, '_validate');

  validateStub.returns('hooray');
  validateStub.onCall(0).throws(new Error('bogus'));

  t.plan(3);

  dummy.validate(props)
    .then(
      () => t.fail('Expected validation to throw'),
      (error) => {
        t.equal(validateStub.firstCall.args[0], props, 'passes props to validator');
        t.equal(error.message, 'bogus', 'passes validation error');

        return dummy.validate(props);
      }
    )
    .then((value) => {
      t.equal(value, 'hooray', 'passes validation value');

      validateStub.restore();
    })
    .catch(t.end);
});
