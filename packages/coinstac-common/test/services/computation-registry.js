'use strict';

const assign = require('lodash/assign');
const bluebird = require('bluebird');
const clone = require('lodash/clone');
const ComputationRegistry =
    require('../../src/services/classes/computation-registry');
const DecentralizedComputation =
    require('../../src/models/decentralized-computation');
const followRedirects = require('follow-redirects');
const fs = require('fs');
const GitHubApi = require('github');
const helpers = require('../helpers/computation-registry-helpers.js');
const mockApiTagResponse = require('../mocks/api-tag-response.json');
const path = require('path');
const registry = require('../mocks/decentralized-computations.json');
const sinon = require('sinon');
const tape = require('tape');
const tar = require('tar-fs');
const url = require('url');
const values = require('lodash/values');

const github = new GitHubApi({ version: '3.0.0' });
const MOCK_COMPUTATION_PATH = helpers.MOCK_COMPUTATION_PATH;
const TEST_COMPUTATION_PATH = helpers.TEST_COMPUTATION_PATH;

// Get a configured ComputationRegistry class
function factory(options) {
  const defaults = {
    github,
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
            `${registryItem.name}@${tag}`
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
    instance.store[`${c.name}@${c.version}`] = c; // eslint-disable-line
  });
}

/**
 * Set up network stubs.
 *
 * Wraps the GitHub API’s `getTags` method and `request`. User must call
 * sinon’s `restore()` on each stub.
 *
 * @param {string} computationSlug A <name>@<version> slug that matches to a
 * mock computation's directory name. This is used on requests to pack a tarball
 * from the directory's contents.
 * @returns {object}
 * @property {function} githubStub
 * @property {function} requestStub
 */
function setupNetworkStubs(computationSlug) {
  const githubStub = sinon.stub(github.repos, 'getTags');
  const getStub = sinon.stub(followRedirects.https, 'get');
  const tarPacker = tar.pack(
    path.join(MOCK_COMPUTATION_PATH, computationSlug),
    {
      map: header => {
        header.name = `${computationSlug}/${header.name}`;

        return header;
      },
    }
  );

  githubStub.yields(null, mockApiTagResponse);
  getStub.yields(tarPacker);
  getStub.returns(tarPacker);

  return {
    githubStub,
    requestStub: getStub,
  };
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


/**
 * Get a URL string from a Node.js `http.request` options hash.
 *
 * @param {Object} urlObject
 * @returns {string}
 */
function urlToString(urlObject) {
  const localUrlObject = clone(urlObject);

  localUrlObject.pathname = localUrlObject.path;
  delete localUrlObject.path;

  return url.format(localUrlObject);
}

tape('constructor', t => {
  function badFactory(options) {
    return new ComputationRegistry(options || {});
  }

  t.throws(badFactory, /github/gi, 'throws with no GitHub API client');
  t.throws(
    badFactory.bind(null, { github }),
    /path/gi,
    'throws with no path'
  );
  t.throws(
    badFactory.bind(null, { github, path }),
    /registry/gi,
    'throws with no registry'
  );

  t.doesNotThrow(factory, 'works with proper args');

  const instance = factory();

  t.ok(
        (
            instance.github === github &&
            instance.path === TEST_COMPUTATION_PATH &&
            instance.registry === registry
        ),
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
  const definition = require(`${MOCK_COMPUTATION_PATH}/${name}@${version}/`);
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
      path.join(instance.path, `${name}@${version}`),
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
  t.plan(1);

  const instance = factory({
    path: MOCK_COMPUTATION_PATH,
    registry: [],
  });
  const name = registry[0].name;
  const version = registry[0].tags[1];
  /* eslint-disable global-require */
  const expected = require(`${MOCK_COMPUTATION_PATH}/${name}@${version}/`);
  /* eslint-enable global-require */

  instance._getFromDisk(name, version)
  .then(definition => {
    t.deepEqual(definition, expected, 'definition matches');
  })
  .catch(t.end);
});

tape('gets computation from source', t => {
  t.plan(7);

  const instance = factory();
  const name = registry[2].name;
  const readdirAsync = bluebird.promisify(fs.readdir);
  const version = registry[2].tags[0];

  const slug = `${name}@${version}`;
  const stubs = setupNetworkStubs(slug);
  const githubStub = stubs.githubStub;
  const installStub = sinon.stub(ComputationRegistry, 'runNPMInstall')
    .returns(Promise.resolve());
  const requestStub = stubs.requestStub;

    // Expected tarball URL, taken from the mock JSON
  const tarballUrl =
    `https://api.github.com/repos/MRN-Code/${name}/tarball/v${version}`;

  instance._getFromSource(name, version)
    .then(res => {
      t.ok(
        res.name === name && res.version === version,
        'returns computation definition'
      );

      const args = githubStub.firstCall.args[0];

      t.ok(
        args.page === 1 && args.repo === name && args.user === 'MRN-Code',
        'calls getTags() with right args'
      );

      t.equal(
        urlToString(requestStub.firstCall.args[0]),
        tarballUrl,
        'requests expected tarball'
      );

      t.ok(
        installStub.calledWithExactly(
          instance._getComputationPath(name, version)
        ),
        'runs npm install on computation'
      );

      return Promise.all([
        readdirAsync(TEST_COMPUTATION_PATH),
        readdirAsync(path.join(TEST_COMPUTATION_PATH, slug)),
      ]);
    })
    .then(([computations, files]) => {
      const requiredFiles = ['index.js', 'package.json'];

      t.ok(
        computations.indexOf(slug) !== -1,
        'unpacks tarball in expected directory'
      );
      t.ok(
        requiredFiles.every(f => files.indexOf(f) !== -1) &&
        files.every(f => {
          return (
            requiredFiles.indexOf(f) !== -1 ||
            f === 'node_modules'
          );
        }),
        'unpacks all computation files'
      );

      // Cleanup
      githubStub.restore();
      installStub.restore();
      requestStub.restore();
      return helpers.cleanupTestDir();
    })

    // Remove temporary test computation directory
    .then(() => t.pass('test cleanup'))
    .catch(t.end);
});

tape('handles GitHub API errors', t => {
  t.plan(1);

  const githubStub = sinon.stub(github.repos, 'getTags');
  const instance = factory();

  githubStub.yields(new Error('bananas'));

  instance._getFromSource(registry[2].name, registry[2].tags[0])
        .then(() => t.fail('expected GitHub API error'))
        .catch(error => {
          t.equal(error.message, 'bananas', 'handles GitHub API error');
          githubStub.restore();
        });
});

tape('handles non-existant GitHub API tag', t => {
  t.plan(1);

  const githubStub = sinon.stub(github.repos, 'getTags');
  const instance = factory();
  const name = registry[2].name;
  const version = registry[2].tags[0];

  githubStub.yields(null, []);

  instance._getFromSource(name, version)
        .then(() => t.fail('expected no present tag'))
        .catch(error => {
          const message = error.message;

          t.ok(
                message.indexOf(name) !== -1 &&
                message.indexOf(version) !== -1,
                'errors with name and tag (version)'
            );

          githubStub.restore();
        });
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
  t.plan(4);

  const instance = factory();
  const name = 'the-ravens';
  const version = '2.0.0';

  const slug = `${name}@${version}`;
  const stubs = setupNetworkStubs(slug);
  const githubStub = stubs.githubStub;
  const requestStub = stubs.requestStub;

  helpers.setupTestDir(slug)
        .then(() => instance.add(name, version))
        .then(response => {
            // Check that `response` matches the mock computation definition
            // (see) the-ravens@2.0.0/index.js
          t.ok(
                (
                    response.name === name &&
                    response.version === version &&
                    response.remote.fn instanceof Function &&
                    response.local.fn instanceof Function
                ),
                'gets computation from disk'
            );

          t.notOk(githubStub.callCount, 'doesn’t call GitHub API');
          t.notOk(requestStub.callCount, 'doesn’t download tarball');

          githubStub.restore();
          requestStub.restore();
        })
        .catch(t.end)
        .then(helpers.cleanupTestDir)
        .then(() => t.pass('test cleanup'));
});

tape('add a computation (gets from network)', t => {
  t.plan(6);

  const instance = factory();
  const name = 'a-small-bag';

    /**
     * Node uses `fs.stat` behind the scenes to see if a `require`-d path
     * exists. By asserting this spy is called before network activiy we can
     * test that a disk search was executed first.
     *
     * {@link https://github.com/nodejs/node/blob/master/lib/module.js}
     */
  const statSpy = sinon.spy(fs, 'stat');
  const version = '1.0.0-beta';

  const expectedUrl =
        `https://api.github.com/repos/MRN-Code/${name}/tarball/v${version}`;
  const slug = `${name}@${version}`;
  const stubs = setupNetworkStubs(slug);
  const githubStub = stubs.githubStub;
  const requestStub = stubs.requestStub;

  instance.add(name, version)
        .then(response => {
          t.ok(
                statSpy.calledWith(path.join(TEST_COMPUTATION_PATH, slug)) &&
                statSpy.calledBefore(githubStub),
                'checks filesystem before going to network'
            );
          t.ok(
                (
                    githubStub.callCount === 1 &&
                    githubStub.firstCall.args[0].repo === name
                ),
                'calls GitHub API'
            );
          t.equal(
                urlToString(requestStub.firstCall.args[0]),
                expectedUrl,
                'downloads computation from source'
            );
          t.deepEqual(
            requestStub.firstCall.args[0].headers,
            {
              'User-Agent': 'COINSTAC',
            },
            'adds user agent to tarball request'
          );
          t.ok(
                (
                    response.name === name &&
                    response.version === version &&
                    response.remote.fn instanceof Function &&
                    response.local.fn instanceof Function
                ),
                'gets computation from network'
            );

          githubStub.restore();
          requestStub.restore();
          statSpy.restore();
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

tape('doesn’t remove unknown computation', t => {
  t.plan(1);

  factory().remove('bogus-name', 'what-is-version')
        .then(() => t.fail('expected bad name/version to reject'))
        .catch(() => t.pass('errored on bad name/version'));
});

tape('remove computation from store', t => {
  t.plan(1);

  const instance = factory();
  const mockComputations = getMockComputations();
  const name = registry[0].name;
  const version = registry[0].tags[0];

  seedInstanceComputations(instance, mockComputations);

  instance.remove(name, version)
  .then(() => {
    t.ok(
      values(instance.store).every(c => {
        return !(c.name === name && c.version === version);
      }),
      'computation removed'
    );
  })
  .catch(t.end);
});

tape('remove computation from disk', t => {
  t.plan(3);

  const instance = factory();
  const name = 'a-small-bag';
  const version = '1.0.0-beta';
  const slug = `${name}@${version}`;
  const stubs = setupNetworkStubs(slug);

  instance.add(name, version)
  .then(computation => {
    t.ok(computation, 'gets computation');
    stubs.githubStub.restore();
    stubs.requestStub.restore();
    return instance.remove(name, version, true);
  })
  .then(() => {
    fs.readdir(TEST_COMPUTATION_PATH, (err, files) => {
      if (err) { return t.end(err); }
      return t.ok(
        files.indexOf(slug) === -1,
        'removes computation from disk'
      );
    });
  })
  .catch(t.end)
  .then(() => helpers.cleanupTestDir())
  .then(() => t.pass('test cleanup'));
});

tape('gets name and version from directory name', t => {
  const get = ComputationRegistry.getNameAndVersion;
  t.deepEqual(get('whatsup@1.0.0'), ['whatsup', '1.0.0']);
  t.deepEqual(
    get('My_Fanciness--200@5.30.1'),
    ['My_Fanciness--200', '5.30.1']
  );
  t.deepEqual(
    get('banana-guards@0.5.1-beta'),
    ['banana-guards', '0.5.1-beta']
  );
  t.end();
});
