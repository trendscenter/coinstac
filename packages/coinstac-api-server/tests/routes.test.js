const test = require('ava');
const sinon = require('sinon');
const routes = require('../src/routes');
const authRoutes = require('../src/routes/auth');
const versionRoutes = require('../src/routes/version');
const helperFunctions = require('../src/auth-helpers');

test('routes', (t) => {
  t.is(routes.length, authRoutes.length + versionRoutes.length);
});

test('authenticate', (t) => {
  const authenticateRoute = authRoutes[0];

  const req = {
    pre: {
      user: {
        passwordHash: 'password',
        username: 'test1',
      },
    },
  };

  const res = (payload) => {
    t.true('id_token' in payload);
    t.deepEqual(payload.user.username, req.pre.user.username);

    return { code: sinon.stub() };
  };

  authenticateRoute.config.handler(req, res);

  t.pass();
});


test('authenticateByToken', (t) => {
  const authenticateByToken = authRoutes[1];

  const req = {
    auth: {
      credentials: {
        passwordHash: 'password',
        username: 'test1',
      },
    },
  };

  const res = (payload) => {
    t.true('id_token' in payload);
    t.deepEqual(payload.user, req.auth.credentials);

    return { code: sinon.stub() };
  };

  authenticateByToken.config.handler(req, res);

  t.pass();
});

test('createAccount', async (t) => {
  const createAccount = authRoutes[2];

  const req = {
    payload: {
      username: 'created-user',
      email: 'created-user@mrn.org',
      password: 'password',
    },
  };

  sinon.stub(helperFunctions, 'hashPassword').resolves('hashed-password');
  sinon.stub(helperFunctions, 'createUser').resolves({
    _id: req.payload.username,
    username: req.payload.username,
    institution: null,
    email: req.payload.email,
    permissions: {},
  });

  const res = (payload) => {
    t.true('id_token' in payload);
    t.is(payload.user.username, req.payload.username);

    return { code: sinon.stub() };
  };

  await createAccount.config.handler(req, res);

  t.pass();

  helperFunctions.hashPassword.restore();
  helperFunctions.createUser.restore();
});


test('version', (t) => {
  const versionRoute = versionRoutes[0];

  const res = (version) => {
    t.truthy(version);
  };

  versionRoute.config.handler({}, res);

  t.pass();
});
