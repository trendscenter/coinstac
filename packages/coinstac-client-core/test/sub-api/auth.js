'use strict';

const atob = require('atob');
const Auth = require('../../src/sub-api/auth.js');
const axios = require('axios');
const halfpenny = require('halfpenny');
const sinon = require('sinon');
const Storage = require('dom-storage');
const tape = require('tape');
const userFactory = require('../utils/user-factory.js');

function halfpennyFactory() {
  return halfpenny({
    agent: axios,
    baseUrl: 'http://localhost:8800',
    store: new Storage(),
  });
}

function authFactory(halfpenny) {
  return new Auth({
    halfpenny: halfpenny || halfpennyFactory(),
  });
}

tape('Auth constructor', (t) => {
  const halfpenny = halfpennyFactory();
  const auth = authFactory(halfpenny);

  t.throws(() => new Auth, 'throws without params');
  t.throws(() => new Auth({ client: null }), 'throws with bad params');
  t.throws(
    () => new Auth({ client: { halfpenny: null } }),
    'throws without halfpenny'
  );
  t.ok(auth, 'constructs okay');
  t.equal(auth.halfpenny, halfpenny, 'sets Halfpenny on instance');
  t.end();
});

tape('Auth#createUser', (t) => {
  const halfpenny = halfpennyFactory();
  const auth = authFactory(halfpenny);
  const user = {
    email: 'test@mrn.org',
    name: 'Test User',
    password: 'test-password',
    username: 'test-username',
  };

  const stub = sinon.stub(halfpenny.users, 'post', () => Promise.resolve(user));

  t.plan(2);

  auth.createUser(user)
  .then((user) => {
    const arg = stub.firstCall.args[0];
    t.ok(
      (
        user.email === arg.email &&
        user.name === arg.label &&
        user.password === atob(arg.password) &&
        user.username === atob(arg.username)
      ),
      'sets user props'
    );
    t.ok(arg.siteId, 'adds a siteId');
    stub.restore();
  })
  .then(t.end, t.end);
});

tape('Auth#getUser and Auth#setUser', t => {
  const auth = authFactory();
  const user = userFactory();

  t.notOk(auth.getUser(), 'no user set initially');

  auth.setUser(user);

  t.deepEquals(user.serialize(), auth.getUser().serialize(), 'sets/gets user');

  t.end();
});

tape('Auth#login errors', (t) => {
  const credentials = {
    password: 'wat-is-pass',
    username: 'wat-is-user',
  };
  const halfpenny = halfpennyFactory();

  const auth = authFactory(halfpenny);
  const stub = sinon.stub(halfpenny.auth, 'login');

  stub.onCall(0).returns(Promise.reject({ status: 500 }));
  stub.onCall(1).returns(Promise.reject({ status: 401 }));
  stub.onCall(2).returns(Promise.reject({
    message: 'I\'m a teapot',
    status: 418,
  }));

  t.plan(5);

  auth.login(credentials)
  .catch((error1) => {
    const args = stub.firstCall.args;

    t.equal(args[0], credentials.username, 'sends username');
    t.equal(args[1], credentials.password, 'sends password');
    t.ok(
      error1 instanceof Error &&
      error1.message.indexOf('Unable to log in') > -1,
      'passes server error'
    );
  })
  .then(() => auth.login(credentials))
  .catch((error2) => {
    t.ok(
      error2 instanceof Error &&
      error2.message.toLowerCase().indexOf('invalid') > -1,
      'passes authentication error'
    );
  })
  .then(() => auth.login(credentials))
  .catch((error3) => {
    t.equal(
      error3.message,
      'I\'m a teapot',
      'passes non 500/401 errors through'
    );

    stub.restore();
  })
  .then(t.end, t.end);
});

tape('Auth#login success', t => {
  const credentials = {
    password: 'little-nice-pass',
    username: 'big-bad-user',
  };
  const halfpenny = halfpennyFactory();
  const user = userFactory().serialize();

  const auth = authFactory(halfpenny);
  const stub = sinon.stub(halfpenny.auth, 'login');

  stub.returns(Promise.resolve({
    data: {
      data: [{ user: user }], // eslint-disable-line object-shorthand
    },
  }));

  t.plan(2);

  auth.login(credentials)
  .then((response) => {
    t.deepEqual(response.serialize(), user, 'responds with user');
    t.deepEqual(
      auth.getUser().serialize(),
      user,
      'sets user to internal store'
    );
    stub.restore();
  })
  .then(t.end, t.end);
});

tape('Auth#logout', t => {
  const halfpenny = halfpennyFactory();
  const auth = authFactory(halfpenny);
  const logoutStub = sinon.stub(halfpenny.auth, 'logout', () => Promise.resolve());
  const storeClearSpy = sinon.spy(halfpenny.store, 'removeItem');

  t.plan(2);

  auth.logout()
  .then(() => {
    t.equal(logoutStub.callCount, 1, 'calls Halfpenny’s logout method');
    t.equal(storeClearSpy.callCount, 1, 'clears Halfpenny’s store');

    logoutStub.restore();
    storeClearSpy.restore();
  });
});
