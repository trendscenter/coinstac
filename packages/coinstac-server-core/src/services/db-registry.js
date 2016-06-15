'use strict';

/**
 * @module service/db-registry
 */

const os = require('os');
const mkdirp = require('mkdirp-promise');
const coinstacCommon = require('coinstac-common');
const memdown = require('memdown');
const url = require('url');
const path = require('path');
const cloneDeep = require('lodash/cloneDeep');

const DB_REGISTRY_DEFAULTS = {
  isRemote: true,
  localStores: null,
  pouchConfig: {},
  remote: {
    db: {
      protocol: 'http',
      hostname: 'localhost',
      port: 5984,
    },
  },
  remoteStoresSyncOut: null,
  verbose: true,
};

module.exports = {
  instance: null,

  /**
   * get db directory.
   * @returns {string}
   */
  getDBPath() {
    return path.join(
      os.tmpdir(),
      'coinstac-server-core',
      'dbs'
    );
  },

  /**
   * get DBRegistry instance
   * @returns {DBRegistry}
   */
  get() {
    /* istanbul ignore next */
    if (!this.instance) {
      throw new Error('dbRegistry must be configured before retrieval');
    }
    return this.instance;
  },

  /**
   * initializes dbRegistry singleton.
   * @returns {Promise} resolves to DBRegistry instance
   */
  init(opts) {
    const config = opts ? cloneDeep(opts) : {};
    const dbRegistryOptions = cloneDeep(DB_REGISTRY_DEFAULTS);
    if (config.dbUrl) {
      dbRegistryOptions.remote.db = url.parse(config.dbUrl);
    }
    if (config.inMemory) {
      dbRegistryOptions.pouchConfig.db = memdown;
    }
    dbRegistryOptions.path = this.getDBPath();
    this.instance = coinstacCommon.services.dbRegistry(dbRegistryOptions);
    return this.upsertDBDir().then(() => this.get());
  },

  /**
   * upsert db dir.
   * @returns {Promise} resolves with db-directory
   */
  upsertDBDir() {
    return mkdirp(this.getDBPath());
  },

  /**
   * removes singleton registry instance.  old instances is garbage
   * collected
   * @returns {undefined}
   */
  teardown() {
    // @note - the pool is responsible for actual db `destroy`ing
    delete this.instance;
  },

};
