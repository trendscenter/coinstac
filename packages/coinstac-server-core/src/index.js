'use strict';

/**
 * @module server
 */
const computationRegistryService = require('./services/computation-registry');
const computationsSyncer = require('./services/computations-database-syncer');
const dbRegistryService = require('./services/db-registry');
const remotePRPService = require('./services/remote-prp');
const seedConsortia = require('./services/seed-consortia');

module.exports = {

  /**
   * exposes primary server components
   * @private
   * @returns {undefined}
   */
  _exposeInternals() {
    this.computationRegistry = computationRegistryService.get();
    this.dbRegistry = dbRegistryService.get();
    this.pool = remotePRPService.pool;
  },

  /**
   *
   * Set up registries, initializers and listeners.
   *
   * @param {object} [config={}]
   * @param {(string|object[])} [config.seed] Whether or not to seed the database.
   * This only seeds if no documents exist in the `consortia` database. Pass
   * JSON as a string or a collection of document objects.
   * @param {string} [config.dbUrl] Database URL.
   * @param {boolean} [config.inMemory=false] Use an in-memory database using
   * instead of writing to disk.
   * @returns {Promise}
   */
  start(config) {
    /* istanbul ignore if */
    if (typeof config === 'undefined') {
      config = {}; // eslint-disable-line no-param-reassign
    }

    // init.
    // do all seed ops after pool init s.t. dbs are-likely-synced across the network
    return dbRegistryService.init(config)
      .then(() => computationRegistryService.init())
      .then(() => seedConsortia(config))
      .then(() => computationsSyncer.sync())
      .then(() => remotePRPService.init())
      .then(() => this._exposeInternals())
      .then(() => this.pool);
  },

  /**
   * stop the server. teardown internal services.
   * @returns {Promise}
   */
  stop() {
    computationRegistryService.teardown();
    dbRegistryService.teardown();
    return remotePRPService.teardown();
  },
};
