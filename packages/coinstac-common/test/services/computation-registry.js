'use strict';

const ComputationRegistry =
  require('../../src/services/classes/computation-registry');
const DecentralizedComputation =
  require('../../src/models/decentralized-computation');
const mockery = require('mockery');
const noop = require('lodash/noop');
const path = require('path');
const pick = require('lodash/pick');
const registry = require('../mocks/decentralized-computations.json');
const sinon = require('sinon');
const tape = require('tape');
const values = require('lodash/values');

// Get a configured ComputationRegistry class
function factory(options) {
  return new ComputationRegistry(Object.assign({ registry }, options));
}

/**
 * Get mock computations.
 *
 * @returns {DecentralizedComputation[]} seeded mock computations
 */
function getMockComputations() {
  return registry.reduce((all, registryItem) => {
    return all.concat(registryItem.tags.map(tag => {
      return new DecentralizedComputation({
        cwd: path.join(
          __dirname,
          ComputationRegistry.getId(registryItem.name, tag)
        ),
        local: {},
        name: registryItem.name,
        remote: {},
        repository: {
          url: registryItem.url,
        },
        version: tag,
      });
    }));
  }, []);
}

/**
 * Seed a ComputationRegistry instance's computations store.
 *
 * @todo Figure out a more elegant way to stock the store.
 *
 * @param {ComputationRegistry} instance
 * @param {DecentralizedComputation[]} computations
 */
function seedInstanceComputations(instance, computations) {
  computations.forEach(c => {
    instance.store[ComputationRegistry.getId(c.name, c.version)] = c; // eslint-disable-line
  });
}

tape('constructor', t => {
  t.throws(
    () => new ComputationRegistry({}),
    /registry/gi,
    'throws with no registry'
  );

  t.doesNotThrow(factory, 'works with proper args');

  const instance = factory();

  t.ok(instance.registry === registry, 'sets instance properties');
  t.end();
});

tape('get computation cwd', t => {
  const getIdStub = sinon
    .stub(ComputationRegistry, 'getId')
    .returns('lodash');
  const name = 'random-module';
  const version = '1.0.0';

  t.equal(
    ComputationRegistry.getComputationCwd(name, version),
    path.join(__dirname, '..', '..', 'node_modules', 'lodash'),
    'returns module path'
  );
  t.deepEqual(
    getIdStub.firstCall.args,
    [name, version],
    'gets'
  );

  getIdStub.restore();
  t.end();
});

tape('adds definition to store', t => {
  t.plan(3);

  const cwd = '/some/random/directory';
  const name = registry[0].name;
  const version = registry[0].tags[1];
  const url = registry[0].url;

  const definition = {
    local: {
      type: 'function',
      fn: noop,
    },
    name,
    remote: {
      type: 'function',
      fn: noop,
    },
    version,
  };
  const instance = factory({ registry: [] });

  instance._doAdd({ cwd, definition, name, url, version })
  .then(computation => {
    t.ok(
      computation instanceof DecentralizedComputation,
      'returns DecentralizedComputation instance'
    );
    t.deepEqual(
      pick(computation, ['cwd', 'name', 'repository', 'version']),
      {
        cwd,
        name,
        repository: { url },
        version,
      },
      'instance name, url and version match'
    );
    t.ok(
      values(instance.store)[0] === computation,
      'saves DecentralizedComputation to internal store'
    );
  })
  .catch(t.end);
});

tape('gets definition from disk', t => {
  t.plan(3);

  const instance = factory({
    registry: [],
  });
  const name = registry[0].name;
  const version = registry[0].tags[1];

  const computation = {
    name,
    version,
  };

  mockery.enable({
    warnOnUnregistered: false,
  });
  mockery.registerMock(
    ComputationRegistry.getId(name, version),
    computation
  );

  instance._getFromDisk('bogus-name', '1.0.0')
    .catch(() => {
      t.pass('rejects with non-existent computation');

      return instance._getFromDisk(registry[3].name, registry[3].tags[0]);
    })
    .catch(() => {
      t.pass('rejects with malformed computation');

      return instance._getFromDisk(name, version);
    })
    .then(definition => {
      t.deepEqual(definition, computation, 'definition matches');
    })
    .catch(t.end)
    .then(mockery.disable);
});

tape('adds a computation', t => {
  t.plan(6);

  const computation = new DecentralizedComputation({
    cwd: __dirname,
    local: {},
    name: registry[0].name,
    remote: {},
    repository: {
      url: registry[0].url,
    },
    version: registry[0].tags[0],
  });
  const cwd = __dirname;
  const definition = {
    local: {
      fn: noop,
      type: 'function',
    },
    name: registry[1].name,
    remote: {
      fn: noop,
      type: 'function',
    },
    version: registry[1].tags[0],
  };
  const instance = factory();

  const doAddStub = sinon.stub(instance, '_doAdd').returns(Promise.resolve());
  const getCwdStub = sinon
    .stub(ComputationRegistry, 'getComputationCwd')
    .returns(cwd);
  const getFromDiskStub = sinon
    .stub(instance, '_getFromDisk')
    .returns(Promise.resolve(definition));
  const getSpy = sinon.spy(instance, 'get');

  // Setup
  seedInstanceComputations(instance, [computation]);
  mockery.enable({
    warnOnUnregistered: false,
  });

  mockery.registerMock(
    ComputationRegistry.getId(registry[1].name, registry[1].tags[0]),
    definition
  );

  instance.add('bananas', 'are yummy')
    .then(() => t.fail('expected to reject'))
    .catch(() => {
      t.pass('rejects on non-registry name/version');

      return instance.add(registry[0].name, registry[0].tags[0]);
    })
    .then(() => {
      t.deepEqual(
        getSpy.firstCall.args,
        [registry[0].name, registry[0].tags[0]],
        'checks in-memory store with name and version'
      );
      t.notOk(
        getFromDiskStub.called,
        'doesn\'t check disk when computation is in memory'
      );
      t.notOk(
        doAddStub.called,
        'doesn\'t add computation when it\'s in memory'
      );

      return instance.add(registry[1].name, registry[1].tags[0]);
    })
    .then(() => {
      t.deepEqual(
        getFromDiskStub.firstCall.args,
        [registry[1].name, registry[1].tags[0]],
        'gets computation from disk'
      );
      t.deepEqual(
        doAddStub.firstCall.args[0],
        {
          cwd,
          definition,
          name: registry[1].name,
          url: registry[1].url,
          version: registry[1].tags[0],
        },
        'adds computation to in-memory store'
      );
    })
    .catch(t.end)
    .then(() => {
      doAddStub.restore();
      getCwdStub.restore();
      getFromDiskStub.restore();
      getSpy.restore();
    });
});

tape('gets all stored computations', t => {
  t.plan(2);

  const instance = factory();
  const mockComputations = getMockComputations();

  seedInstanceComputations(instance, mockComputations);

  instance.all()
    .then(computations => {
      t.ok(computations.length, 'returns *some* computations');
      t.deepEqual(
        computations,
        mockComputations,
        'returns all stored computations'
      );
    })
    .catch(t.end);
});

tape('get fails on with no computation name', t => {
  t.plan(1);

  factory().get()
    .then(() => t.fail('expected to reject without args'))
    .catch(() => t.pass('rejects without args'));
});

tape('get fails on with no computation name', t => {
  t.plan(1);

  factory().get('bananas')
    .then(() => t.fail('expected no version to reject'))
    .catch(() => t.pass('rejects without version'));
});

tape('gets computation by name and version', t => {
  t.plan(2);

  const instance = factory();
  const mockComputations = getMockComputations();
  const name = registry[0].name;
  const version = registry[0].tags[0];

  seedInstanceComputations(instance, mockComputations);

  instance.get('bogus-name', 'what is a version even')
    .then(() => {
      t.fail('returned bogus computation');
    })
    .catch(error => {
      t.ok(error, 'errored on bogus computation name');
    });

  instance.get(name, version)
    .then(computation => {
      t.ok(
        (
          computation.name === name &&
          computation.version === version
        ),
        'gets computation by name and version'
      );
    })
    .catch(t.end);
});

tape('gets name and version from directory name', t => {
  const get = ComputationRegistry.getNameAndVersion;
  t.deepEqual(get('whatsup--1.0.0'), ['whatsup', '1.0.0']);
  t.deepEqual(
    get('My_Fanciness-200--5.30.1'),
    ['My_Fanciness-200', '5.30.1']
  );
  t.deepEqual(
    get('banana-guards--0.5.1-beta'),
    ['banana-guards', '0.5.1-beta']
  );
  t.equal(get('rando-string'), null, 'returns null for no matches');
  t.end();
});

