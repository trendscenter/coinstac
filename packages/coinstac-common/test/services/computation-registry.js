'use strict';

const assign = require('lodash/assign');
const ComputationRegistry =
    require('../../src/services/classes/computation-registry');
const DecentralizedComputation =
    require('../../src/models/decentralized-computation');
const helpers = require('../helpers/computation-registry-helpers.js');
const path = require('path');
const registry = require('../mocks/decentralized-computations.json');
const tape = require('tape');
const values = require('lodash/values');

const MOCK_COMPUTATION_PATH = helpers.MOCK_COMPUTATION_PATH;
const TEST_COMPUTATION_PATH = helpers.TEST_COMPUTATION_PATH;

// Get a configured ComputationRegistry class
function factory(options) {
  const defaults = {
    path: TEST_COMPUTATION_PATH,
    registry,
  };

  return new ComputationRegistry(assign({}, defaults, options));
}

/**
 * Get mock computations.
 *
 * @returns {DecentralizedComputation[]} seeded mock computations
 */
function getMockComputations() {
  return registry.reduce((all, registryItem) => {
    all = all.concat(registryItem.tags.map(tag => {
      return new DecentralizedComputation({
        cwd: path.join(
            TEST_COMPUTATION_PATH,
            `${registryItem.name}--${tag}`
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

    return all;
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
    instance.store[`${c.name}--${c.version}`] = c; // eslint-disable-line
  });
}

/**
 * Get a computation filter function.
 *
 * @param {string} name
 * @param {string} version Semver version
 * @returns {function}
 */
function filterComputation(name, version) {
  return function _filterComputation(computation) {
    return computation.name === name && computation.version === version;
  };
}

tape('constructor', t => {
  function badFactory(options) {
    return new ComputationRegistry(options || {});
  }

  t.throws(badFactory, /path/gi, 'throws with no path');
  t.throws(
    badFactory.bind(null, { path }),
    /registry/gi,
    'throws with no registry'
  );

  t.doesNotThrow(factory, 'works with proper args');

  const instance = factory();

  t.ok(
    instance.path === TEST_COMPUTATION_PATH && instance.registry === registry,
    'sets instance properties'
  );
  t.end();
});

tape('adds definition to store', t => {
  t.plan(3);

  const instance = factory({ registry: [] });
  const name = registry[0].name;
  const version = registry[0].tags[1];
  /* eslint-disable global-require */
  const definition = require(`${MOCK_COMPUTATION_PATH}/${name}--${version}/`);
  /* eslint-enable global-require */
  const url = registry[0].url;

  instance._doAdd({ definition, name, url, version })
  .then(computation => {
    t.ok(
      computation instanceof DecentralizedComputation,
      'returns DecentralizedComputation instance'
    );
    t.ok(
      (
        computation.name === name &&
        computation.repository.url === url &&
        computation.version === version
      ),
      'instance name, url and version match'
    );
    t.ok(
      values(instance.store)[0] === computation,
      'saves DecentralizedComputation to internal store'
    );
  })
  .catch(t.end);
});

tape('sets definition’s cwd on model', t => {
  t.plan(1);

  const instance = factory();
  const name = registry[0].name;
  const version = registry[0].tags[1];

  const definition = {
    local: {
      type: 'function',
      fn: () => 1,
    },
    name,
    repository: {
      url: 'https://github.com/MRN-Code',
    },
    remote: {
      type: 'function',
      fn: () => 2,
    },
    setup: cb => cb(null, true),
    version,
  };

  instance._doAdd({ definition, name, version })
  .then(computation => {
    t.equal(
      computation.cwd,
      path.join(instance.path, `${name}--${version}`),
      'sets cwd on string setup'
    );
  })
  .catch(t.end);
});

tape('gets computation path', t => {
  const instance = factory();
  const name = registry[0].name;
  const version = registry[0].tags[1];

  const computationPath = instance._getComputationPath(name, version);

  t.ok(
    computationPath.indexOf(TEST_COMPUTATION_PATH) !== -1,
    'contains path'
  );
  t.ok(computationPath.indexOf(name) !== -1, 'contains name');
  t.ok(computationPath.indexOf(version) !== -1, 'contains version');
  t.end();
});

tape('gets definition from disk', t => {
  t.plan(3);

  const instance = factory({
    path: MOCK_COMPUTATION_PATH,
    registry: [],
  });
  const name = registry[0].name;
  const version = registry[0].tags[1];
  /* eslint-disable global-require */
  const expected = require(`${MOCK_COMPUTATION_PATH}/${name}--${version}/`);
  /* eslint-enable global-require */

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
      t.deepEqual(definition, expected, 'definition matches');
    })
    .catch(t.end);
});

tape('adds computation that isn’t registered', t => {
  t.plan(1);

  const instance = factory();

  instance.add('bananas', 'are yummy')
    .then(() => t.fail('expected to reject'))
    .catch(() => {
      t.ok('rejects on non-registry name/version');
    });
});

tape('add a computation (gets from memory)', t => {
  t.plan(1);

  const instance = factory();
  const mockComputations = getMockComputations();
  const name = registry[1].name;
  const itemUrl = registry[1].url;
  const version = registry[1].tags[0];

  const computation = mockComputations.find(
    filterComputation(name, version)
  );

  // Setup
  instance._doAdd({
    definition: computation,
    name,
    itemUrl,
    version,
  })
    .then(() => instance.add(name, version))
    .then(response => {
      // `response` and expected `computation` are different instances
      t.deepEqual(
        response.serialize(),
        computation.serialize(),
        'gets computation from memory'
      );
    })
    .catch(t.end);
});

tape('add a computation (gets from disk)', t => {
  t.plan(2);

  const instance = factory();
  const name = 'the-ravens';
  const version = '2.0.0';

  const slug = `${name}--${version}`;

  helpers.setupTestDir(slug)
    .then(() => instance.add(name, version))
    .then(response => {
      // Check that `response` matches the mock computation definition
      // (see) the-ravens--2.0.0/index.js
      t.ok(
        (
          response.name === name &&
          response.version === version &&
          response.remote.fn instanceof Function &&
          response.local.fn instanceof Function
        ),
        'gets computation from disk'
      );
    })
    .catch(t.end)
    .then(helpers.cleanupTestDir)
    .then(() => t.pass('test cleanup'));
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

