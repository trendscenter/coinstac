/* eslint-disable global-require */
const test = require('ava');
const sinon = require('sinon');
const database = require('../src/database');
const plugins = require('../src/plugins');

test('start server 1', (t) => {
  require('../src');

  t.pass();
});

test.serial('start server 2', (t) => {
  sinon.stub(database, 'connect').resolves();

  require('../src');

  t.pass();

  database.connect.restore();
});


test.serial('start server 3', (t) => {
  sinon.stub(database, 'connect').rejects(new Error('error'));

  require('../src');

  t.pass();

  database.connect.restore();
});

test('plugins', (t) => {
  plugins[2].options.graphqlOptions();
  t.is(plugins.length, 3);
  t.pass();
});
