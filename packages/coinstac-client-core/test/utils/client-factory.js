'use strict';

const assign = require('lodash/assign');
const bluebird = require('bluebird');
const CoinstacClient = require('../../');
const conf = require('./load-config');
const config = require('../../config.js');
const DBRegistry = require('coinstac-common').services.dbRegistry.DBRegistry;
const getLoginResponse = require('./get-login-response.js');
const nock = require('nock');
const pouchDBAdapterMemory = require('pouchdb-adapter-memory');
const testDirectory = require('./test-directory.js');
const userFactory = require('./user-factory');
const LocalStorageMemory = require('localstorage-memory');

bluebird.config({ warnings: false });

// PouchDB 5.4.x requires the memory plugin
DBRegistry.Pouchy.plugin(pouchDBAdapterMemory);

/**
 * @returns {Promise}
 */
module.exports = function clientFactory(opts) {
  const defaults = {
    /**
     * Place test files in a separate directory so that tests don't mess with
     * development application state.
     */
    appDirectory: testDirectory,
    logLevel: 'error',
    user: userFactory(),
    storage: LocalStorageMemory,
  };
  const clientOpts = assign(defaults, opts, conf);
  const cc = new CoinstacClient(clientOpts);

  /**
   * Wrap authentication requests -- fired when `CoinstacClient#initialize` --
   * using nock.
   *
   * {@link https://www.npmjs.com/package/nock}
   */
  nock(config.get('baseUrl'))
    .post('/auth/keys')
    .reply(200, JSON.stringify(getLoginResponse(clientOpts.user)));

  return cc.initialize({
    password: clientOpts.user.password,
    username: clientOpts.user.username,
  })
  .then(() => {
    cc.auth.logout = () => Promise.resolve();
    return cc;
  });
};
