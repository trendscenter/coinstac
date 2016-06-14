'use strict';

const pdbsConfig = require('./.pouchdb-server-config');
const common = require('coinstac-common');
const dbRegistryFactory = common.services.dbRegistry;
const computationRegistryFactory = common.services.computationRegistry;

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
      computationRegistryFactory({ registry: [] }),
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
      local: { pouchConfig: { db: require('memdown') } },
      noURLPrefix: true, // disable db pre-fixing (e.g. no `up/`, `down/`)
      path: __dirname,
      remote: {
        pouchConfig: { db: require('memdown') },
        db: { protocol: 'http', hostname: 'localhost', port: pdbsConfig.port },
      },
    });
  },
};
