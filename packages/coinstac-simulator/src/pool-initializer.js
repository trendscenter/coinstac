'use strict';

const pdbsConfig = require('./.pouchdb-server-config');
const common = require('coinstac-common');
const DBRegistry = require('coinstac-common').services.dbRegistry.DBRegistry;
DBRegistry.Pouchy.plugin(require('pouchdb-adapter-memory'));
const dbRegistryFactory = common.services.dbRegistry;
const computationRegistryFactory = common.services.computationRegistry;
const path = require('path');

/**
 * @private
 * @module pool-initializer
 * @description utility to generate PipelineRunnerPool inputs, used by
 * compute client and compute servers
 */
module.exports = {

  /**
   * get a functional set of constructor opts for a PipelineRunnerPool
   * @returns {Promise}
   */
  getPoolOpts(opts) {
    if (!opts) { throw new ReferenceError('opts required'); }
    return Promise.all([
      computationRegistryFactory({
        path: path.join(__dirname, '..', '.tmp'),
        registry: [],
      }),
      this.getDBRegistry(opts.dbRegistry),
    ])
    .then((r) => ({
      computationRegistry: r[0],
      dbRegistry: r[1],
    }));
  },

  /**
   * configure a registry that sets up local dbs to be inmem and
   * remote dbs inmem.  the remote dbs will connect to another
   * inmem db (pouchdb-server), simulating a full roundtrip
   * @param {object} opts db-registry config options
   * @returns {DBRegistry}
   */
  getDBRegistry(opts) {
    return dbRegistryFactory({
      isLocal: opts.isLocal,
      isRemote: !opts.isLocal,
      local: { pouchConfig: { adapter: 'memory' } },
      noURLPrefix: true, // disable db pre-fixing (e.g. no `up/`, `down/`)
      path: __dirname,
      remote: {
        pouchConfig: { adapter: 'memory' },
        db: { protocol: 'http', hostname: 'localhost', port: pdbsConfig.port },
      },
    });
  },
};
