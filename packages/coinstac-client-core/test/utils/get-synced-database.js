'use strict';

const EventEmitter = require('events');
const getSyncedDatabase = require('../../src/utils/get-synced-database');
const sinon = require('sinon');
const tape = require('tape');

function getMockDBRegistry(pouchy) {
  return {
    get: sinon.stub().returns(pouchy),
  };
}

tape('rejects with errors', t => {
  t.plan(2);

  getSyncedDatabase()
    .then(() => t.fail('Resolves with no DB registry'))
    .catch(() => t.pass('Rejects with no DB registry'));

  getSyncedDatabase({})
    .then(() => t.fail('Resolves with no DB name'))
    .catch(() => t.pass('Rejects with no DB name'));
});

tape('handles non-replicating or already synced', t => {
  const mockPouchy1 = {};
  const mockPouchy2 = {
    _hasLikelySynced: true,
    url: 'http://coins.mrn.org/bananas',
  };

  const mockDBRegistry1 = getMockDBRegistry(mockPouchy1);
  const mockDBRegistry2 = getMockDBRegistry(mockPouchy2);

  t.plan(3);

  getSyncedDatabase(mockDBRegistry1, 'name-1')
    .then(response => {
      t.ok(
        mockDBRegistry1.get.calledWithExactly('name-1'),
        'gets DB by name'
      );
      t.equal(response, mockPouchy1, 'returns non-replicating DB');

      return getSyncedDatabase(mockDBRegistry2, 'name-2');
    })
    .then(response => {
      t.equal(response, mockPouchy2, 'returns already synced DB');
    })
    .catch(t.end);
});

tape('handles sync error', t => {
  const ee = new EventEmitter();
  const error = new Error('wat');
  const mockDBRegistry = getMockDBRegistry({
    _hasLikelySynced: false,
    syncEmitter: ee,
    url: 'http://coins.mrn.org/bananas',
  });

  t.plan(2);

  getSyncedDatabase(mockDBRegistry, 'bananas')
    .then(() => t.fail('resolves with sync errors'))
    .catch(response => {
      t.equal(response, error, 'rejects on sync errors');
      t.equal(ee.eventNames().length, 0, 'removes all registered listeners');
    });

  ee.emit('error', error);
});

tape('handles sync success', t => {
  const ee = new EventEmitter();
  const mockPouchy = {
    _hasLikelySynced: false,
    syncEmitter: ee,
    url: 'http://coins.mrn.org/bananas',
  };
  const mockDBRegistry = getMockDBRegistry(mockPouchy);

  t.plan(2);

  getSyncedDatabase(mockDBRegistry, 'bananas')
    .then(response => {
      t.equal(mockPouchy, response, 'returns DB');
      t.equal(ee.eventNames().length, 0, 'removes all registered listeners');
    })
    .catch(t.end);

  ee.emit('hasLikelySynced');
});
