'use strict';

const dbRegistryService = require('../../src/services/db-registry');
const sinon = require('sinon');
const syncService = require('../../src/services/computations-database-syncer');
const tape = require('tape');

class MockDecentralizedComputation {
  constructor(opts) {
    this.name = opts.name;
    this.version = opts.version;
  }

  getComputationDocument() {
    return {
      name: this.name,
      version: this.version,
    };
  }

  static factory(opts) {
    return new MockDecentralizedComputation(opts);
  }
}

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
      toAdd: [],
      toDelete: [],
      toUpdate: [],
    },
    'diff object generated'
  );

  t.deepEqual(
    syncService.getComputationsDiff(
      mockGoldenSet.map(MockDecentralizedComputation.factory),
      []
    ),
    {
      toAdd: mockGoldenSet,
      toDelete: [],
      toUpdate: [],
    },
    'add diff generated'
  );


  t.deepEqual(
    syncService.getComputationsDiff(
      mockGoldenSet.map(MockDecentralizedComputation.factory),
      [{
        name: 'b',
        version: '0.5.0',
      }]
    ),
    {
      toAdd: mockGoldenSet.slice(0, 2),
      toDelete: [],
      toUpdate: mockGoldenSet.slice(-1),
    },
    'update diff generated'
  );

  t.deepEqual(
    syncService.getComputationsDiff(
      mockGoldenSet.map(MockDecentralizedComputation.factory),
      mockDeleteSet
    ),
    {
      toAdd: mockGoldenSet,
      toDelete: mockDeleteSet.map(c => Object.assign({}, c, { _deleted: true })),
      toUpdate: [],
    }
  );

  t.end();
});

tape('Synchronizes database', (t) => {
  const rawComputations = [{
    name: 'a-great-computation',
    version: '1.0.0',
  }, {
    name: 'whoa-computerz',
    version: '2.0.0',
  }, {
    name: 'zulu',
    version: '0.5.0',
  }];

  const dbStub = {
    all: sinon.stub().returns(Promise.resolve([
      {
        name: rawComputations[1].name,
        version: '1.0.0',
      },
      rawComputations[2],
    ])),
    bulkDocs: sinon.stub().returns(Promise.resolve([])),
  };
  const decentralizedComputations = rawComputations
    .slice(0, 2)
    .map(MockDecentralizedComputation.factory);

  dbStub.bulkDocs.onCall(1).returns(Promise.resolve([{
    ok: true,
    id: 'test-id',
    rev: 'test-rev',
  }, {
    error: true,
    message: 'Document update conflict',
    status: 409,
  }]));

  t.plan(2);

  syncService.sync(dbStub, decentralizedComputations)
    .then(() => {
      t.deepEqual(
        dbStub.bulkDocs.firstCall.args[0],
        rawComputations.slice(0, 2).concat(
          {
            _deleted: true,
            name: rawComputations[1].name,
            version: '1.0.0',
          },
          {
            _deleted: true,
            name: rawComputations[2].name,
            version: rawComputations[2].version,
          }
        ),
        'bulk-updates computation database'
      );

      return syncService.sync(dbStub, decentralizedComputations);
    })
    .catch((error) => {
      t.ok(
        error.message.includes('Document update conflict'),
        'passes bulkDocs error'
      );
    })
    .catch(t.end);
});

