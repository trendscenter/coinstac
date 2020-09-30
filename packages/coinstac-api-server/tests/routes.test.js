const test = require('ava');
const sinon = require('sinon');
const find = require('lodash/find');
const routes = require('../src/routes');
const authRoutes = require('../src/routes/auth');
const versionRoutes = require('../src/routes/version');
const helperFunctions = require('../src/auth-helpers');

const resMock = { code: () => {} };

test('routes', (t) => {
  t.is(routes.length, authRoutes.length + versionRoutes.length);
});

test('authenticate', (t) => {
  const authenticateRoute = find(authRoutes, { path: '/authenticate' });

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

    return resMock;
  };

  authenticateRoute.config.handler(req, res);
});


test('authenticateByToken', (t) => {
  const authenticateByToken = find(authRoutes, { path: '/authenticateByToken' });

  const req = {
    auth: {
      credentials: {
        email: 'test1@mrn.org',
        id: 'test1',
        institution: '',
        permissions: {},
        username: 'test1',
        photo: null,
        photoID: null,
        name: 'test1',
      },
    },
  };

  const res = (payload) => {
    t.true('id_token' in payload);
    t.deepEqual(payload.user, req.auth.credentials);

    return resMock;
  };

  authenticateByToken.config.handler(req, res);
});

test('createAccount', async (t) => {
  const createAccount = find(authRoutes, { path: '/createAccount' });

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

    return resMock;
  };

  await createAccount.config.handler(req, res);

  helperFunctions.hashPassword.restore();
  helperFunctions.createUser.restore();
});

test('sendPasswordResetEmail', async (t) => {
  const createAccount = find(authRoutes, { path: '/sendPasswordResetEmail' });

  const req = {
    payload: {
      email: 'test@mrn.org',
    },
  };

  sinon.stub(helperFunctions, 'savePasswordResetToken').resolves();

  const successRes = () => ({
    code: (status) => {
      t.is(status, 204);
    },
  });

  await createAccount.config.handler(req, successRes);

  helperFunctions.savePasswordResetToken.restore();

  sinon.stub(helperFunctions, 'savePasswordResetToken').rejects();

  const failRes = () => ({
    code: (status) => {
      t.is(status, 400);
    },
  });

  await createAccount.config.handler(req, failRes);

  helperFunctions.savePasswordResetToken.restore();
});


test('resetPassword', async (t) => {
  const createAccount = find(authRoutes, { path: '/resetPassword' });

  const req = {
    payload: {
      token: 'token',
      password: 'password',
    },
  };

  sinon.stub(helperFunctions, 'resetPassword').resolves();

  const res = () => {
    return {
      code: (status) => {
        t.is(status, 204);
      },
    };
  };

  await createAccount.config.handler(req, res);

  helperFunctions.resetPassword.restore();
});

test('version', (t) => {
  const versionRoute = find(versionRoutes, { path: '/version' });

  const res = (version) => {
    t.truthy(version);
  };

  versionRoute.config.handler({}, res);
});
