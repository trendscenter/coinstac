'use strict';

const dbRegistryService = require('../../src/services/db-registry');
const sinon = require('sinon');
const syncService = require('../../src/services/computations-database-syncer');
const tape = require('tape');

tape('seed diffing', (t) => {
  const mockGoldenSet = [{
    name: 'a',
    version: '1.0.0',
  }, {
    name: 'b',
    version: '1.0.0',
  }, {
    name: 'b',
    version: '0.5.0',
  }];
  const mockDeleteSet = [{
    name: 'c',
    version: '1.0.0',
  }];

  t.deepEqual(
    syncService.getComputationsDiff([], []),
    {
      add: [],
      delete: [],
      update: [],
    },
    'diff object generated'
  );

  t.deepEqual(
    syncService.getComputationsDiff(mockGoldenSet, []),
    {
      add: mockGoldenSet,
      delete: [],
      update: [],
    },
    'add diff generated'
  );


  t.deepEqual(
    syncService.getComputationsDiff(
      mockGoldenSet,
      [{
        name: 'b',
        version: '0.5.0',
      }]
    ),
    {
      add: mockGoldenSet.slice(0, 2),
      delete: [],
      update: mockGoldenSet.slice(-1),
    },
    'update diff generated'
  );

  t.deepEqual(
    syncService.getComputationsDiff(mockGoldenSet, mockDeleteSet),
    {
      add: mockGoldenSet,
      delete: mockDeleteSet.map(c => Object.assign({}, c, { _deleted: true })),
      update: [],
    }
  );

  t.end();
});

tape('patches DB', t => {
  const bulkStub = sinon.stub().returns(Promise.resolve());
  const dbGetStub = sinon.stub(dbRegistryService, 'get')
    .returns({
      get: () => ({ bulkDocs: bulkStub }),
    });
  const diff = {
    add: 'so add',
    delete: 'very delete',
    update: 'wow update',
  };

  t.plan(4);

  syncService.patchDBWithComputationDiff(diff)
    .then(response => {
      t.equal(bulkStub.firstCall.args[0], 'so add', 'bulk adds');
      t.equal(bulkStub.secondCall.args[0], 'wow update', 'bulk updates');
      t.equal(bulkStub.thirdCall.args[0], 'very delete', 'bulk deletes');
      t.equal(response, diff, 'resolves with diff');
    })
    .catch(t.end)
    .then(() => dbGetStub.restore());
});

// tape(, t => {
//   syncService.sync()
//
//
//
//
// });
//
