'use strict';

const mockery = require('mockery');
const sinon = require('sinon');
const tape = require('tape');

tape('cleans user data', t => {
  const dir = '/tmp/coinstac';
  const username = 'bogus-username';

  const appStub = {
    core: {
      getDatabaseDirectory: sinon.stub().returns(dir),
      teardown: sinon.stub().returns(Promise.resolve()),
    },
  };
  const electronStub = {
    dialog: {
      showMessageBox: sinon.stub(),
    },
  };
  const rimrafStub = sinon.stub();

  mockery.enable({
    warnOnUnregistered: false,
  });
  mockery.registerMock('ampersand-app', appStub);
  mockery.registerMock('electron', electronStub);
  mockery.registerMock('rimraf', rimrafStub);

  // Dynamic `require` is necessary to mock electron
  /* eslint-disable global-require */
  const clean = require('../../../app/main/services/clean');
  /* eslint-enable global-require */

  electronStub.dialog.showMessageBox.onCall(0).yields(1);
  electronStub.dialog.showMessageBox.yields(0);
  rimrafStub.yields(null);

  t.plan(9);

  clean.userData(username)
    .then(response => {
      t.notOk(response, 'returns false when not deleting');
      t.ok(electronStub.dialog.showMessageBox.called, 'shows dialog');
      t.notOk(
        rimrafStub.called,
        'doesn\'t remove directory when dialog canceled'
      );
      t.notOk(appStub.core.teardown.called, 'doesn\'t tear down core');

      return clean.userData(username);
    })
    .then(response => {
      t.ok(response, 'returns true when deleting');
      t.ok(
        appStub.core.getDatabaseDirectory.calledWith(username),
        'gets user\'s database directory'
      );
      t.ok(rimrafStub.calledWith(dir), 'removes directory');
      t.ok(appStub.core.teardown.called, 'tears down core');
    })
    .then(() => {
      mockery.disable();
      t.pass('teardown');
    })
    .catch(t.end);
});

