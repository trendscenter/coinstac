'use strict';

/**
 * Integration test to ensure computation documents aren't duplicated.
 *
 * Strategy:
 *
 * 1. Spin up faux CouchDB using pouchdb-server
 * 2. Seed with stubbed computation docs, some of which need to be deleted
 * 3. Initialize server by calling `CoinstacServer#start`
 * 4. Shut down server
 * 5. Get database state
 * 6. Assert database docs are as expected
 *
 * {@link https://github.com/MRN-Code/coinstac/issues/100}
 */

const coinstacCommon = require('coinstac-common');
const coinstacComputationRegistry = require('coinstac-computation-registry');
const omit = require('lodash/omit');
const partialRight = require('lodash/partialRight');
const pify = require('pify');
const server = require('../src/index.js');
const sinon = require('sinon');
const sortBy = require('lodash/sortBy');
const spawnPouchDBServer = require('spawn-pouchdb-server');
const tape = require('tape');

const blackList = [{
  name: 'blacker-than-black',
  url: 'https://github.com/MRN-Code/blacker-than-black',
  version: '1.0.0',
}, {
  name: 'goes-to-eleven',
  url: 'https://github.com/MRN-Code/goes-to-eleven',
  version: '11.0.0',
}];
const port = 5985;
const Pouchy = coinstacCommon.services.dbRegistry.DBRegistry.Pouchy;
const whiteList = [{
  name: 'smell-the-glove',
  url: 'https://github.com/MRN-Code/smell-the-glove',
  version: '1.0.0',
}, {
  name: 'smell-the-glove',
  url: 'https://github.com/MRN-Code/smell-the-glove',
  version: '2.0.0',
}, {
  name: 'the-sun-never-sweats',
  url: 'https://github.com/MRN-Code/the-sun-never-sweats',
  version: '3.0.0',
}, {
  name: 'the-sun-never-sweats',
  url: 'https://github.com/MRN-Code/the-sun-never-sweats',
  version: '3.1.0',
}];

let allStub;
let pouchDBServer;

function getDb(sync = 'out') {
  return new Pouchy({
    sync,
    url: `http://localhost:${port}/computations`,
  });
}

tape('setup', (t) => {
  t.plan(2);

  allStub = sinon
    .stub(
      coinstacComputationRegistry.ComputationRegistry.prototype,
      'all'
    )
    // Mock `DecentralizedComputation`s
    .returns(Promise.resolve(whiteList.map(item => Object.assign({}, item, {
      getComputationDocument() {
        return item;
      },
    }))));

  return pify(spawnPouchDBServer)({
    backend: false,
    config: {
      file: false,
    },
    log: {
      file: false,
    },
    port,
    verbose: false,
  })
    .then((pouchServer) => {
      pouchDBServer = pouchServer;
      t.pass(`PouchDB server started at localhost:${port}`);

      // Seed in-memory db
      return getDb().bulkDocs(blackList.concat(whiteList[3]));
    })
    .then((responses) => {
      t.notOk(
        responses.filter(r => r.error).length,
        'stubs computation database'
      );
    })
    .then(t.end);
});

tape('test', (t) => {
  t.plan(2);

  server.start({
    dbUrl: 'http://localhost:5985',
    inMemory: true,
  })
    .then(() => server.stop())
    .then(() => {
      t.pass('server stopped');

      return getDb('in').all();
    })
    .then((docs) => {
      t.deepEqual(
        sortBy(
          docs.map(partialRight(omit, ['_id', '_rev'])),
          ['name', 'version']
        ),
        sortBy(whiteList, ['name', 'version']),
        'doesn\'t create duplicate computation documents'
      );
    })
    .catch(t.end);
});

tape('teardown', (t) => {
  t.plan(1);

  allStub.restore();
  pouchDBServer.stop(() => t.pass('PouchDB server exited'));
});
