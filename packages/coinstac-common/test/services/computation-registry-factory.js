'use strict';

require('../helpers/boot');
const ComputationRegistry =
    require('../../src/services/classes/computation-registry');
const computationRegistryFactory =
    require('../../src/services/computation-registry-factory');
const DBRegistry = require('../../src/services/classes/db-registry');
const fs = require('fs');
const helpers = require('../helpers/computation-registry-helpers');
const mockDecentralizedComputations =
    require('../mocks/decentralized-computations.json');
const path = require('path');
const sinon = require('sinon');
const tape = require('tape');

const REPO_PATH = path.join(__dirname, '..', '..');

function getValidLocalOptions() {
  return {
    dbRegistry: new DBRegistry({
      localStores: ['computations'],
      pouchConfig: {
        adapter: 'memory',
      },
      remote: {
        db: 'https://localhost:1234',
      },
    }),
    isLocal: true,
  };
}

tape('works without configuration', t => {
  t.plan(1);

  computationRegistryFactory()
        .then(computationRegistry => {
          t.ok(
                computationRegistry &&
                computationRegistry instanceof ComputationRegistry,
                'returns a registry instance'
            );
        })
        .catch(t.end);
});

tape('passes custom registry', t => {
  t.plan(1);

  computationRegistryFactory({
    registry: mockDecentralizedComputations,
  })
        .then(computationRegistry => {
          t.equal(
                computationRegistry.registry,
                mockDecentralizedComputations
            );
        })
        .catch(t.end);
});

tape('sets path', t => {
  t.plan(2);

  const customPath = path.join(
        __dirname, '..', 'mocks', 'decentralized-computations.json'
    );

  computationRegistryFactory()
        .then(computationRegistry => {
          t.ok(
                computationRegistry.path.indexOf(REPO_PATH) !== -1,
                'sets computation path in repo for remote'
            );
        })
        .catch(t.end);

  computationRegistryFactory({ path: customPath })
        .then(computationRegistry => {
          t.equal(
                computationRegistry.path,
                customPath,
                'sets custom path'
            );
        })
        .catch(t.end);
});

tape('scan disk handles error', t => {
  t.plan(1);

  const readdirStub = sinon.stub(fs, 'readdir');
  readdirStub.yields(new Error('pineapples'), null);

  computationRegistryFactory({
    path: helpers.TEST_COMPUTATION_PATH,
    scanDisk: true,
  })
        .then(() => t.fail('expected readdir error'))
        .catch(error => {
          readdirStub.restore();
          t.equal(error.message, 'pineapples', 'handles readdir error');
        });
});

tape('scans disk for existing computations', t => {
  t.plan(5);

  const name1 = 'a-small-bag';
  const name2 = 'the-ravens';
  const version1 = '1.0.0-beta';
  const version2 = '2.0.0';

  helpers.setupTestDir([name1 + '@' + version1, name2 + '@' + version2])
        .then(() => computationRegistryFactory({
          path: helpers.TEST_COMPUTATION_PATH,
          scanDisk: true,
        }))
        .then(computationRegistry => {
          t.ok(computationRegistry, 'gets registry');
          t.equal(
                Object.keys(computationRegistry.store).length,
                2,
                'only stores existing computations'
            );

            /**
             * Hijack ComputationRegistry's private method to make sure it
             * doesn't retrieve from disk again.
             */
          computationRegistry._getFromDisk = function () {
            throw new Error('Attempted to get definition from disk');
          };

          return Promise.all([
            computationRegistry.get(name1, version1),
            computationRegistry.get(name2, version2),
          ]);
        })
        .then(computations => {
          t.ok(
                computations[0].name === name1 &&
                computations[0].version === version1,
                'stores first in memory'
            );
          t.ok(
                computations[1].name === name2 &&
                computations[1].version === version2,
                'stores second in memory'
            );
        })
        .catch(t.end)
        .then(helpers.cleanupTestDir)
        .then(() => t.pass('test cleanup'));
});

tape('isLocal throws proper config', t => {
  t.throws(
        computationRegistryFactory.bind(null, {
          isLocal: true,
        }),
        'throws without dbRegistry'
    );
  t.throws(
        computationRegistryFactory.bind(null, {
          dbRegistry: 'dbRegistry',
          isLocal: true,
        }),
        'throws with bad dbRegistry'
    );
  t.end();
});

tape('configures local computation registry', t => {
  t.plan(3);

  computationRegistryFactory(getValidLocalOptions())
        .then(computationRegistry => {
          t.ok(computationRegistry, 'returns computation registry');
          t.equal(
                computationRegistry.registry.length,
                0,
                'sets empty internal registry'
            );
          t.ok(
                computationRegistry.path.indexOf(REPO_PATH) === -1,
                'sets path outside of repo'
            );
        })
        .catch(t.end);
});

tape('local computation registry fetches computations from source', t => {
  t.plan(4);

  const compAddStub = sinon.stub(ComputationRegistry.prototype, 'add');
  const options = getValidLocalOptions();
  const name = 'the-ravens';
  const spy = sinon.spy();
  const version = '2.0.0';

  const dbGetStub = sinon.stub(options.dbRegistry, 'get');
  const returnDocs = mockDecentralizedComputations.reduce((all, c) => {
    if (c.name !== name) {
      return all;
    }

    return all.concat(c.tags.filter(t => t === version).map(version => {
      return {
        name: c.name,
        version: version,
        url: c.url,
      };
    }));
  }, []);

  dbGetStub.returns({
    find: () => {
      spy.apply(spy, arguments);

      return Promise.resolve({
        docs: returnDocs,
      });
    },
  });

  computationRegistryFactory(options)
        .then(computationRegistry => {
          t.ok(dbGetStub.calledWith('computations'), 'gets computations DB');

          return computationRegistry.add(name, version)
                .then(() => {
                  t.equal(
                        spy.callCount,
                        1,
                        'gets all documents from computations DB'
                    );
                  t.deepEqual(
                        computationRegistry.registry[0],
                    {
                      name: name,
                      tags: [version],
                      url: returnDocs[0].url,
                    },
                        'sets computations docs to internal registry'
                    );
                  t.deepEqual(
                        compAddStub.firstCall.args,
                        [name, version],
                        'proxies to ComputationRegistry#add'
                    );

                  compAddStub.restore();
                  dbGetStub.restore();
                });
        })
        .catch(t.end);
});

tape('local computation registry mutates whitelist', t => {
  t.plan(2);

    // Prevent network calls by stubbing 'add':
  const compAddStub = sinon.stub(ComputationRegistry.prototype, 'add');
  const options = getValidLocalOptions();
  const name = 'the-ravens';
  const version = '2.0.0';
  const url = 'https://github.com/MRN-Code/the-ravens';

  const dbGetStub = sinon.stub(options.dbRegistry, 'get');
  const registry = [{
    name: name,
    tags: ['1.0.0', '3.0.0'],
    url: url,
  }];

  dbGetStub.returns({
    find: () => Promise.resolve({
      docs: [{
        name: name,
        version: version,
        url: url,
      }],
    }),
  });

  options.registry = registry;

  computationRegistryFactory(options)
        .then(computationRegistry => Promise.all([
          Promise.resolve(computationRegistry),
          computationRegistry.add(name, version),
        ]))
        .then(responses => {
          const instance = responses[0];

          t.equal(instance.registry, registry, 'keeps passed registry');
          t.ok(
                instance.registry[0].tags.indexOf(version) !== -1,
                'adds version to existing registry item'
            );
        })
        .catch(t.end)
        .then(() => {
          compAddStub.restore();
          dbGetStub.restore();
        });
});

tape('local computation registry handles not-found computation', t => {
  t.plan(1);

  const options = getValidLocalOptions();
  const name = 'the-ravens';
  const version = '2.0.0';

  const dbGetStub = sinon.stub(options.dbRegistry, 'get');

  dbGetStub.returns({
    find: () => Promise.resolve({ docs: [] }),
  });

  computationRegistryFactory(options)
        .then(computationRegistry => computationRegistry.add(name, version))
        .then(() => t.fail('expected not-found error'))
        .catch(() => t.pass('rejects with not-found error'))
        .then(() => dbGetStub.restore());
});
