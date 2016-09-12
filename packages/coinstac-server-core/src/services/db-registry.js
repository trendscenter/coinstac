'use strict';

/**
 * @module service/db-registry
 */

const os = require('os');
const mkdirp = require('mkdirp');
const url = require('url');
const path = require('path');
const pify = require('pify');
const cloneDeep = require('lodash/cloneDeep');
const common = require('coinstac-common');
const pouchDBAdapterMemory = require('pouchdb-adapter-memory');
const pouchDbAdapterLevelDB = require('pouchdb-adapter-leveldb');

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
    // Unfortunately necessary for sinon spying
    const dbRegistryFactory = common.services.dbRegistry;

    const config = opts ? cloneDeep(opts) : {};
    const dbRegistryOptions = cloneDeep(DB_REGISTRY_DEFAULTS);
    if (config.dbUrl) {
      dbRegistryOptions.remote.db = url.parse(config.dbUrl);
    }

    if (config.inMemory) {
      dbRegistryFactory.DBRegistry.Pouchy.plugin(pouchDBAdapterMemory);
      dbRegistryOptions.pouchConfig.adapter = 'memory';
    } else {
      dbRegistryFactory.DBRegistry.Pouchy.plugin(pouchDbAdapterLevelDB);
      dbRegistryOptions.pouchConfig.adapter = 'leveldb';
    }

    dbRegistryOptions.path = this.getDBPath();
    this.instance = dbRegistryFactory(dbRegistryOptions);
    return this.upsertDBDir().then(() => this.get());
  },

  /**
   * upsert db dir.
   * @returns {Promise} resolves with db-directory
   */
  upsertDBDir() {
    return pify(mkdirp)(this.getDBPath());
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
