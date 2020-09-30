/* eslint-disable global-require */
const test = require('ava');
const sinon = require('sinon');
const database = require('../src/database');
const plugins = require('../src/plugins');

test('start server', (t) => {
  /* case 1 */
  require('../src');
  t.pass();

  /* success */
  sinon.stub(database, 'connect').resolves();
  require('../src');
  t.pass();
  database.connect.restore();

  /* fail */
  sinon.stub(database, 'connect').rejects(new Error('error'));
  require('../src');
  t.pass();
  database.connect.restore();
});

test('plugins', (t) => {
  plugins[2].options.graphqlOptions();

  t.is(plugins.length, 3);
});
