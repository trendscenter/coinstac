'use strict';

const coinstacCommon = require('coinstac-common');
const coinstacComputationRegistry = require('coinstac-computation-registry');
const mockConsortiumDocs = require('./mocks/consortium-docs.json');
const server = require('../src/');
const sinon = require('sinon');
const tape = require('tape');
const url = require('url');

const RemotePipelineRunnerPool =
  coinstacCommon.models.pipeline.runner.pool.RemotePipelineRunnerPool;
const ComputationRegistry = coinstacComputationRegistry.ComputationRegistry;
let addStub;

// Stub `ComputationRegistry#add` so no network requests occur
tape('setup', t => {
  addStub = sinon
    .stub(ComputationRegistry.prototype, 'add')
    .returns(Promise.resolve());

  t.end();
});

tape('works without configuration', t => {
  t.plan(3);

  const response = server.start({ inMemory: true });

  t.ok(response instanceof Promise, 'returns a Promise');

  response
  .then(pool => {
    t.ok(pool instanceof RemotePipelineRunnerPool, 'resolves to pool instance');
  })
  .then(() => server.stop())
  .then(() => t.pass('tears down'))
  .catch(t.end);
});

tape('passes database URL', t => {
  t.plan(2);

  const dbUrl = 'https://wild-west.database.net:1234/';
  const spy = sinon.spy(coinstacCommon.services, 'dbRegistry');

  server.start({
    dbUrl: dbUrl, // eslint-disable-line object-shorthand
    inMemory: true,
  })
  .then(() => {
    const rslt = url.format(spy.firstCall.args[0].remote.db);
    spy.restore();
    t.equal(rslt, dbUrl, 'custom database URL OK');
  })
  .then(() => server.stop())
  .then(() => t.pass('tears down'))
  .catch(t.end);
});

tape('seeds stringified docs', t => {
  t.plan(2);
  server.start({
    inMemory: true,
    seed: JSON.stringify(mockConsortiumDocs),
  })
  .then(() => server.getInstance().dbRegistry.get('consortia').all())
  // @TODO no fake server. if couchdb is up, it may auto-sync many consortia
  // down before this assertion occurs.  brittle test.
  .then((docs) => t.ok(docs.length >= mockConsortiumDocs.length, 'seeds docs'))
  .then(() => server.stop())
  .then(() => t.pass('tears down'))
  .catch(t.end);
});

tape('rejects naughty seed docs', t => {
  t.plan(2);

  server.start({
    inMemory: true,
    seed: 'rubbish string',
  })
  .then(
    () => t.fail('accepted bad seed docs'),
    () => t.pass('rejected on bad seed docs')
  )
  .then(server.stop)
  .then(() => t.pass('tears down'))
  .catch(t.end);
});

tape('handles pool errors', t => {
  const message = 'whoopsie';
  const stub = sinon.stub(
    RemotePipelineRunnerPool.prototype,
    'init',
    () => Promise.reject(new Error(message))
  );

  t.plan(2);

  server.start({ inMemory: true })
    .then(() => t.fail('didn’t handle pool init error'))
    .catch(error => {
      t.equal(error.message, message, 'rejects with init error');
      stub.restore();
      return server.stop();
    })
    .then(() => t.pass('tears down'))
    .catch(t.end);
});

tape('wires up to pool events', t => {
  t.plan(2);

  const events = [
    'pipeline:inProgress',
    'queue:end',
    'queue:start',
    'run:end',
    'run:start',
  ];

  server.start({ inMemory: true })
    .then(pool => {
      t.ok(
        events.every(e => !!pool.events.listenerCount(e)),
        'listens on every event'
      );
      return server.stop();
    })
    .then(() => t.pass('tears down'))
    .catch(t.end);
});

tape('teardown', (t) => {
  addStub.restore();
  t.end();
});
