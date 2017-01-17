'use strict';

const ComputationRegistry = require('../src/computation-registry.js');
const DBRegistry = require('coinstac-common').services.dbRegistry.DBRegistry;
const factory = require('../src/factory.js');
const mockDecentralizedComputations =
  require('./mocks/decentralized-computations.json');
const pouchDBAdapterMemory = require('pouchdb-adapter-memory');
const sinon = require('sinon');
const tape = require('tape');

DBRegistry.Pouchy.plugin(pouchDBAdapterMemory);

let addStub;

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

tape('setup', t => {
  addStub = sinon
    .stub(ComputationRegistry.prototype, 'add')
    .returns(Promise.resolve());

  t.end();
});

tape('configuration errors', t => {
  t.plan(2);

  factory({
    isLocal: true,
  })
    .then(() => t.fail('resolves without DB registry'))
    .catch(() => t.pass('rejects without DB registry'));

  factory({
    dbRegistry: {},
    isLocal: true,
  })
    .then(() => t.fail('resolves with bad DB registry'))
    .catch(() => t.pass('rejects with bad DB registry'));
});

tape('returns ComputationRegistry instance', t => {
  t.plan(4);

  factory()
    .then(computationRegistry => {
      t.ok(
        computationRegistry &&
        computationRegistry instanceof ComputationRegistry,
        'returns instance without args'
      );

      return factory({
        registry: [],
      });
    })
    .then(computationRegistry => {
      t.ok(computationRegistry, 'returns a non-local registry instance');

      return factory(getValidLocalOptions());
    })
    .then(computationRegistry => {
      t.ok(
        computationRegistry &&
        computationRegistry instanceof ComputationRegistry,
        'returns a local registry instance'
      );
      t.equal(
        computationRegistry.registry.length,
        0,
        'sets empty internal registry'
      );
    })
    .catch(t.end);
});

tape('passes custom registry', t => {
  t.plan(1);

  factory({
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

tape('local computation registry fetches computations from source', t => {
  t.plan(4);

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
        version,
        url: c.url,
      };
    }));
  }, []);

  dbGetStub.returns({
    find: () => {
      spy.apply(spy, arguments);

      return Promise.resolve(returnDocs);
    },
  });

  factory(options)
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
            name,
            tags: [version],
            url: returnDocs[0].url,
          },
          'sets computations docs to internal registry'
        );
        t.deepEqual(
          addStub.lastCall.args,
          [name, version],
          'proxies to ComputationRegistry#add'
        );
      });
    })
    .catch(t.end)
    .then(() => dbGetStub.restore());
});

tape('local computation registry mutates whitelist', t => {
  t.plan(2);

  // Prevent network calls by stubbing 'add':
  const options = getValidLocalOptions();
  const name = 'the-ravens';
  const version = '2.0.0';
  const url = 'https://github.com/MRN-Code/the-ravens';

  const dbGetStub = sinon.stub(options.dbRegistry, 'get');
  const registry = [{
    name,
    tags: ['1.0.0', '3.0.0'],
    url,
  }];

  dbGetStub.returns({
    find: () => Promise.resolve([{
      name,
      version,
      url,
    }]),
  });

  options.registry = registry;

  factory(options)
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
    .then(() => dbGetStub.restore());
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

  factory(options)
    .then(computationRegistry => computationRegistry.add(name, version))
    .then(() => t.fail('expected not-found error'))
    .catch(() => t.pass('rejects with not-found error'))
    .then(() => dbGetStub.restore());
});

tape('remote computation registry retrieves all computations', t => {
  const expected = [{
    name: 'the-ravens',
    version: '1.0.0',
  }, {
    name: 'the-ravens',
    version: '2.0.0',
  }, {
    name: 'the-ravens',
    version: '3.0.0',
  }, {
    name: 'owl-pillows',
    version: '0.5.0',
  }, {
    name: 'a-small-bag',
    version: '1.0.0-beta',
  }];

  t.plan(1);

  factory({
    registry: mockDecentralizedComputations,
  })
    .then(() => {
      t.ok(
        expected.every(e => addStub.calledWithExactly(e.name, e.version)),
        'adds every decentralized computation to registry'
      );
    })
    .catch(t.end);
});

tape('teardown', t => {
  addStub.restore();
  t.end();
});
