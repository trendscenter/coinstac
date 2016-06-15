'use strict';

const test = require('tape');
const ModelService = require('../src/model-service');

class Dummy extends ModelService {
  modelServiceHooks() {
    return { dbName: 'test-db-name', ModelType: function _() {} };
  }
}
Dummy.test = 'testing';
test('ModelService basic', (t) => {
  t.ok(ModelService instanceof Function, 'ModelService is fn');
  t.throws(() => new ModelService(), 'explodes without content');
  t.end();
});

test('ModelService extension', (t) => {
  const d = new Dummy({ dbRegistry: {}, client: {} });
  t.ok(d, 'extension GO!');
  t.end();
});
