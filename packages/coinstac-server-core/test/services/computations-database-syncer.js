'use strict';

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
