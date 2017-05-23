'use strict';

const AuthenticationService =
  require('../../src/sub-api/authentication-service.js');
const Halfpenny = require('halfpenny');
const sinon = require('sinon');
const tape = require('tape');

function getUser() {
  return {
    acctExpDate: null,
    activeFlag: null,
    dateAdded: undefined,
    email: 'test@mrn.org',
    emailUnsubscribed: true,
    institution: 'Mind Research Network',
    isSiteAdmin: 'f',
    label: 'Bob Bob',
    name: 'Robert Robert',
    password: 'bobbobbob',
    passwordExpDate: Date.now(),
    passwordResetExpiration: undefined,
    passwordResetKey: undefined,
    passwordResetSessionId: undefined,
    siteId: '7',
    username: 'bob',
  };
}

tape('AuthenticationService :: constructor', (t) => {
  const auth = AuthenticationService.factory();

  t.ok(auth instanceof Halfpenny, 'extends Halfpenny');

  t.end();
});

tape('AuthenticationService :: user storage', (t) => {
  const auth = AuthenticationService.factory();
  const user = getUser();

  t.notOk(auth.getUser(), 'sets empty user');

  auth.setUser(user);

  t.deepEqual(auth.getUser(), user, 'retrieves set user');

  auth.clearUser();

  t.notOk(auth.getUser(), 'clears stored user');

  t.end();
});

tape('AuthenticationService :: database credentials storage', (t) => {
  const auth = AuthenticationService.factory();
  const credentials = {
    password: 'oooh-no',
    username: 'silly-uname',
  };

  t.notOk(auth.getDatabaseCredentials(), 'sets empty database credentials');

  auth.setDatabaseCredentials(credentials);

  t.deepEqual(
    auth.getDatabaseCredentials(),
    credentials,
    'retrieves set database credentials'
  );

  auth.clearDatabaseCredentials();

  t.notOk(auth.getDatabaseCredentials(), 'clears database credentials');

  t.end();
});

tape('AuthenticationService :: login/logout`', (t) => {
  const auth = AuthenticationService.factory();
  const credentials = {
    password: 'so-secret-dbs',
    username: 'great-db-user',
  };
  const user = getUser();
  const response = {
    data: {
      data: [{
        coinstac: credentials,
        user,
      }],
    },
  };

  const loginStub = sinon.stub(Halfpenny.prototype, 'login')
    .returns(Promise.resolve(response));
  const logoutStub = sinon.stub(Halfpenny.prototype, 'logout')
    .returns(Promise.resolve());

  t.plan(7);

  auth.login(user)
    .then((res) => {
      t.equal(loginStub.callCount, 1, 'calls Halfpenny login');
      t.equal(res, response, 'passes login response');
      t.deepEqual(auth.getUser(), user, 'sets user on login');
      t.deepEqual(
        auth.getDatabaseCredentials(),
        credentials,
        'sets database credentials on login'
      );

      return auth.logout();
    })
    .then(() => {
      t.equal(logoutStub.callCount, 1, 'calls Halfpenny logout');
      t.notOk(
        auth.getDatabaseCredentials(),
        'clears database credentials on logout'
      );
      t.notOk(auth.getUser(), 'clears user on logout');
    })
    .catch(t.end)
    .then(() => {
      loginStub.restore();
      logoutStub.restore();
    });
});
