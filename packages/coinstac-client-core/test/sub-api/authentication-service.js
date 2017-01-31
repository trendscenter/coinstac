'use strict';

const AuthenticationService =
  require('../../src/sub-api/authentication-service.js');
const Halfpenny = require('halfpenny');
const sinon = require('sinon');
const tape = require('tape');

function getUser() {
  return {
    activeFlag: null,
    acctExpDate: null,
    email: 'test@mrn.org',
    emailUnsubscribed: true,
    institution: 'Mind Research Network',
    isSiteAdmin: 'f',
    label: 'Bob Bob',
    name: 'Robert Robert',
    password: 'bobbobbob',
    passwordExpDate: Date.now(),
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

tape('AuthenticationService :: login/logout`', (t) => {
  const auth = AuthenticationService.factory();
  const user = getUser();
  const response = {
    data: {
      data: [{
        user,
      }],
    },
  };

  const loginStub = sinon.stub(Halfpenny.prototype, 'login')
    .returns(Promise.resolve(response));
  const logoutStub = sinon.stub(Halfpenny.prototype, 'logout')
    .returns(Promise.resolve());

  t.plan(5);

  auth.login(user)
    .then((res) => {
      t.equal(loginStub.callCount, 1, 'calls Halfpenny login');
      t.equal(res, response, 'passes login response');
      t.deepEqual(auth.getUser(), user, 'sets user on login');

      return auth.logout();
    })
    .then(() => {
      t.equal(logoutStub.callCount, 1, 'calls Halfpenny logout');
      t.notOk(auth.getUser(), 'clears user on logout');
    })
    .catch(t.end)
    .then(() => {
      loginStub.restore();
      logoutStub.restore();
    });
});
