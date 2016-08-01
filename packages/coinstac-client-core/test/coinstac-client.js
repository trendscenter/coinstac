'use strict';

const assign = require('lodash/assign');
const Auth = require('../src/sub-api/auth.js');
const bluebird = require('bluebird');
const clientFactory = require('./utils/client-factory');
const CoinstacClient = require('../');
const ComputationService = require('../src/sub-api/computation-service.js');
const config = require('../config.js');
const ConsortiaService = require('../src/sub-api/consortia-service.js');
const crasher = require('./utils/crash-hard');
const fs = require('fs');
const getLoginResponse = require('./utils/get-login-response.js');
const identity = require('lodash/identity');
const loadConfig = require('./utils/load-config.js');
const nock = require('nock');
const noop = require('lodash/noop');
const path = require('path');
const pick = require('lodash/pick');
const ProjectService = require('../src/sub-api/project-service.js');
const sinon = require('sinon');
const teardownAuth = require('../src/teardown/auth.js');
const test = require('tape');
const LocalStorageMemory = require('localstorage-memory');

crasher.setup();

test('CoinstacClient - constructor', (t) => {
  let c;
  t.plan(3);
  t.throws(() => new CoinstacClient(), 'requires opts');
  clientFactory()
  .then((client) => { c = client; })
  .then(() => t.ok(c.appDirectory, 'has appDirectory'))
  .then(() => c.teardown())
  .then(() => t.pass('teardown'))
  .then(t.end, t.end);
});

test('CoinstacClient - logger injections', (t) => {
  let c;
  t.plan(2);
  clientFactory({
    logger: {
      error: identity,
      info: identity,
      verbose: identity,
    },
  })
  .then((client) => { c = client; })
  .then(() => t.equal(c.logger.info('bananas'), 'bananas', 'logger injection ok'))
  .then(() => c.teardown())
  .then(() => t.pass('teardown'))
  .then(t.end, t.end);
});

test('CoinstacClient - initialize errors', t => {
  t.plan(4);
  const emptyCredentials = {
    password: null,
    username: null,
  };
  const cc = new CoinstacClient({
    storage: LocalStorageMemory,
  });

  cc.initialize.bind(null)()
  .catch((err) => t.ok(err, 'rejects with bad “this”'))
  .then(() => cc.initialize())
  .catch((err) => t.ok(err, 'rejects without params'))
  .then(() => cc.initialize({}))
  .catch((err) => t.ok(err, 'rejects with missing credentials'))
  .then(() => cc.initialize(emptyCredentials))
  .catch((err) => t.ok(err, 'rejects with empty credentials'))
  .then(t.end, t.end);
});

test('CoinstacClient - initialize process', (t) => {
  const opts = assign(
    {
      appDirectory: path.resolve(__dirname, '..', '.tmp'),
      logger: {
        // disable logging during test
        info: noop,
        verbose: noop,
      },
      storage: LocalStorageMemory,
    },
    loadConfig
  );
  const cc = new CoinstacClient(opts);
  const credentials = {
    password: 'wat-pass',
    username: 'wat-user',
  };
  const initPoolSpy = sinon.spy(CoinstacClient.prototype, '_initPool');
  const initRegistrySpy = sinon.spy(
    CoinstacClient.prototype,
    '_initComputationRegistry'
  );
  const loginResponse = getLoginResponse();
  const loginSpy = sinon.spy(Auth.prototype, 'login');

  t.plan(8);

  nock(config.get('baseUrl'))
    .post('/auth/keys')
    .reply(200, JSON.stringify(loginResponse));

  nock(config.get('baseUrl'))
    .delete(/^\/auth\/keys\/\d+$/g)
    .reply(201);

  cc.initialize(credentials)
  .then((user) => {
    t.deepEqual(
      user,
      pick(loginResponse.data[0].user, Object.keys(user)),
      'returns user'
    );
  })
  /**
   * Ensure the application directory is created. It’s impossible to wrap
   * `mkdirp` with Sinon, so to a `fs.stat`:
   */
  .then(() => bluebird.promisify(fs.stat, { context: fs })(cc.appDirectory))
  .then((stat) => t.ok(stat, '“upserts” application directory'))
  .then(() => {
    /**
     * Halfpenny doesn’t export its `ApiClient` class, so an exact check is
     * impossible.
     */
    t.ok(
      'halfpenny' in cc && cc.halfpenny instanceof Object,
      'sets Halfpenny instance'
    );
    t.ok(
      (
        'auth' in cc && cc.auth instanceof Auth &&
        'consortia' in cc && cc.consortia instanceof ConsortiaService &&
        'computations' in cc && cc.computations instanceof ComputationService &&
        'projects' in cc && cc.projects instanceof ProjectService
      ),
      'sets sub-api services'
    );
    t.equal(
      loginSpy.firstCall.args[0],
      credentials,
      'calls login with credentials'
    );
    t.ok(initRegistrySpy, 'calls init computation registry');
    t.ok(initPoolSpy.callCount, 'calls init pool');

    loginSpy.restore();
    initPoolSpy.restore();
    initRegistrySpy.restore();
  })
  .then(() => cc.teardown())
  .then(() => t.pass('teardown'))
  .then(t.end, t.end);
});

test('CoinstacClient - teardown process', (t) => {
  const teardownAuthSpy = sinon.spy(teardownAuth, 'teardownAuth');
  let dbRegistryDestroy;
  let c;

  t.plan(4);

  clientFactory()
  .then((client) => {
    c = client;
    dbRegistryDestroy = sinon.spy(c.dbRegistry, 'destroy');
  })
  .then(() => c.teardown())
  .then(() => {
    t.ok(teardownAuthSpy.callCount, 'calls auth teardown');
    t.ok(dbRegistryDestroy.callCount, 'destroys DB registry');
    t.ok(!('halfpenny' in c), 'drops Halfpenny reference');
    t.ok(
      (
        !('auth' in c) &&
        !('consortia' in c) &&
        !('computations' in c) &&
        !('projects' in c)
      ),
      'removes sub-api references'
    );
    dbRegistryDestroy.restore();
    teardownAuthSpy.restore();
  })
  .then(t.end, t.end);
});
