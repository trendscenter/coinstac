'use strict';

const assign = require('lodash/assign');
const bluebird = require('bluebird');
const fs = require('fs');
const identity = require('lodash/identity');
const nock = require('nock');
const noop = require('lodash/noop');
const path = require('path');
const pick = require('lodash/pick');
const sinon = require('sinon');
const test = require('tape');
const LocalStorageMemory = require('localstorage-memory');
const AuthenticationService = require('../src/sub-api/authentication-service.js');
const clientFactory = require('./utils/client-factory');
const CoinstacClient = require('../');
const ComputationService = require('../src/sub-api/computation-service.js');
const config = require('../config.js');
const ConsortiaService = require('../src/sub-api/consortia-service.js');
const crasher = require('./utils/crash-hard');
const getLoginResponse = require('./utils/get-login-response.js');
const loadConfig = require('./utils/load-config.js');
const ProjectService = require('../src/sub-api/project-service.js');

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

test('CoinstacClient - initialize errors', (t) => {
  t.plan(4);
  const emptyCredentials = {
    password: null,
    username: null,
  };
  const cc = new CoinstacClient({
    storage: LocalStorageMemory,
  });

  cc.initialize.bind(null)()
    .catch(err => t.ok(err, 'rejects with bad “this”'))
    .then(() => cc.initialize())
    .catch(err => t.ok(err, 'rejects without params'))
    .then(() => cc.initialize({}))
    .catch(err => t.ok(err, 'rejects with missing credentials'))
    .then(() => cc.initialize(emptyCredentials))
    .catch(err => t.ok(err, 'rejects with empty credentials'))
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
  const loginSpy = sinon.spy(AuthenticationService.prototype, 'login');

  t.plan(7);

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
    .then(stat => t.ok(stat, '“upserts” application directory'))
    .then(() => {
      t.ok(
        (
          'auth' in cc && cc.auth instanceof AuthenticationService
        && 'consortia' in cc && cc.consortia instanceof ConsortiaService
        && 'computations' in cc && cc.computations instanceof ComputationService
        && 'projects' in cc && cc.projects instanceof ProjectService
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
  const logoutStub1 = sinon.stub().returns(bluebird.resolve());
  const logoutStub2 = sinon.stub().returns(bluebird.resolve());
  const clientStub1 = {
    auth: {
      logout: logoutStub1,
    },
    computations: null,
    consortia: null,
    halfpenny: null,
    pool: {
      destroy: sinon.stub().returns(bluebird.resolve()),
    },
    project: null,
  };
  const clientStub2 = {
    auth: {
      logout: logoutStub2,
    },
    computations: null,
    consortia: null,
    dbRegistry: {
      destroy: sinon.stub().returns(bluebird.resolve()),
    },
    halfpenny: null,
    project: null,
  };

  t.plan(4);

  CoinstacClient.prototype.teardown.apply(clientStub1)
    .then(() => {
      t.ok(logoutStub1.called, 'logs out');
      t.ok(clientStub1.pool.destroy.called, 'destroys pool when it exists');
      t.ok(
        !('halfpenny' in clientStub1)
        && !('auth' in clientStub1)
        && !('consortia' in clientStub1)
        && !('computations' in clientStub1)
        && !('projects' in clientStub1),
        'deletes sub-api services'
      );

      return CoinstacClient.prototype.teardown.apply(clientStub2);
    })
    .then(() => {
      t.ok(
        clientStub2.dbRegistry.destroy.called,
        'destroys database registry when pool doesn\'t exist'
      );
    })
    .catch(t.end);
});

test('CoinstacClient - auth initialization', (t) => {
  const authStub = {
    login: sinon.stub().returns(Promise.resolve()),
    signup: sinon.stub().returns(Promise.resolve()),
  };
  const credentials = {
    email: 'test@mrn.org',
    name: 'test',
    password: 'testtest',
    username: 'test',
  };

  t.plan(2);

  CoinstacClient.prototype._initAuthorization.call(
    { auth: authStub },
    credentials
  )
    .then(() => {
      t.ok(
        authStub.signup.calledWith(credentials),
        'calls create user'
      );
      t.ok(
        authStub.login.calledWith(credentials),
        'calls login'
      );
    })
    .catch(t.end);
});
