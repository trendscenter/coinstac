'use strict';

const test = require('tape');
const syncService = require('../../src/services/computations-database-syncer');

test('seed diffing', (t) => {
  t.deepEqual(
    syncService.getComputationsDiff([], []),
    { add: [], update: [], delete: [] },
    'diff object generated'
  );

  const mockGoldenSetA = [{ name: 'a', tags: ['a'] }, { name: 'b', tags: ['b1', 'b2'] }];
  t.deepEqual(
    syncService.getComputationsDiff(mockGoldenSetA, []),
    { add: mockGoldenSetA, update: [], delete: [] },
    'add diff generated'
  );


  t.deepEqual(
    syncService.getComputationsDiff(mockGoldenSetA, [{ name: 'b', tags: ['z'] }]),
    { add: [mockGoldenSetA[0]], update: [mockGoldenSetA[1]], delete: [] },
    'update diff generated'
  );

  t.deepEqual(
    syncService.getComputationsDiff(mockGoldenSetA, [{ name: 'c', tags: ['c'] }]),
    { add: mockGoldenSetA, update: [], delete: [{ name: 'c', tags: ['c'], _deleted: true }] },
    'delete diff generated'
  );

  t.end();
});
