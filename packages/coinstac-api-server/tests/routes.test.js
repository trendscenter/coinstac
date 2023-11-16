const test = require('ava');
const sinon = require('sinon');
const find = require('lodash/find');
const routes = require('../src/routes');
const authRoutes = require('../src/routes/auth');
const versionRoutes = require('../src/routes/version');
const helperFunctions = require('../src/auth-helpers');

const { USER_IDS } = require('../seed/populate');

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

  const res = {
    response: (payload) => {
      t.true('id_token' in payload);
      t.deepEqual(payload.user.username, req.pre.user.username);

      return resMock;
    },
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

  const res = {
    response: (payload) => {
      t.true('id_token' in payload);
      t.deepEqual(payload.user, req.auth.credentials);

      return resMock;
    },
  };

  authenticateByToken.config.handler(req, res);
});

test('authenticateWithApiKey', (t) => {
  const authenticateWithApiKey = find(authRoutes, { path: '/authenticateWithApiKey' });

  const req = {
    pre: {
      headlessClient: {
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

  const res = {
    response: (payload) => {
      t.true('authToken' in payload);
      t.deepEqual(payload.client, req.pre.headlessClient);

      return resMock;
    },
  };

  authenticateWithApiKey.config.handler(req, res);
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

  const res = {
    response: (payload) => {
      t.true('id_token' in payload);
      t.is(payload.user.username, req.payload.username);

      return resMock;
    },
  };

  await createAccount.config.handler(req, res);

  helperFunctions.hashPassword.restore();
  helperFunctions.createUser.restore();
});

test('updateAccount', async (t) => {
  const updateAccount = find(authRoutes, { path: '/updateAccount' });

  const req = {
    payload: {
      id: USER_IDS[0],
      name: 'John',
      username: 'test1',
      email: 'test1@mrn.org',
      photo: 'photo',
      photoID: 'photoId',
      institution: 'institution',
    },
  };

  sinon.stub(helperFunctions, 'updateUser').resolves({
    ...req.payload,
    permissions: {},
  });

  const res = {
    response: (payload) => {
      t.is(payload.user.username, req.payload.username);

      return resMock;
    },
  };

  await updateAccount.config.handler(req, res);

  helperFunctions.updateUser.restore();
});

test('logout', async (t) => {
  const logout = find(authRoutes, { path: '/logout' });

  const req = {
    payload: {
      username: 'test1',
    },
  };

  const res = {
    response: (payload) => {
      t.is(payload.username, req.payload.username);

      return resMock;
    },
  };

  logout.config.handler(req, res);
});

test('sendPasswordResetEmail', async (t) => {
  const createAccount = find(authRoutes, { path: '/sendPasswordResetEmail' });

  const req = {
    payload: {
      email: 'test@mrn.org',
    },
  };

  sinon.stub(helperFunctions, 'savePasswordResetToken').resolves();

  const successRes = {
    response: () => ({
      code: (status) => {
        t.is(status, 204);
      },
    }),
  };

  await createAccount.config.handler(req, successRes);

  helperFunctions.savePasswordResetToken.restore();

  sinon.stub(helperFunctions, 'savePasswordResetToken').rejects();

  const failRes = {
    response: () => ({
      code: (status) => {
        t.is(status, 400);
      },
    }),
  };

  await createAccount.config.handler(req, failRes);

  helperFunctions.savePasswordResetToken.restore();
});


test('resetForgotPassword', async (t) => {
  const createAccount = find(authRoutes, { path: '/resetForgotPassword' });

  const req = {
    payload: {
      token: 'token',
      password: 'password',
    },
  };

  sinon.stub(helperFunctions, 'resetForgotPassword').resolves();

  const res = {
    response: () => ({
      code: (status) => {
        t.is(status, 204);
      },
    }),
  };

  await createAccount.config.handler(req, res);

  helperFunctions.resetForgotPassword.restore();
});

test('version', (t) => {
  const versionRoute = find(versionRoutes, { path: '/version' });

  const res = {
    response: (version) => {
      t.truthy(version);
    },
  };

  versionRoute.config.handler({}, res);
});
