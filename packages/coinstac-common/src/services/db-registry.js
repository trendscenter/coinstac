'use strict';

const assign = require('lodash/assign');
const DBRegistry = require('./classes/db-registry');

/**
 * @module services/db-registry
 * @description Returns a DBRegistry instance, configured with coinstac business
 * logic tailored to the target environment. The registry can be used for a
 * user/client, or a computation server. DB stores are automatically configured.
 */

/**
 * @see DBRegistry for full list of options accepted by the registry factory.
 * @param {object} opts All `opts` are applied as attrs directly to each DBRegistry
 *                      instance.  The following attrs are _special_ cases for the
 *                      factory exported here.
 *                      opts.remote _must_ be provided in all cases, with
 *                      opts.remote.db specified to build the remote url
 * @param {string=} opts.path configures dest dir to write DBs into
 * @param {boolean=} opts.isLocal configures the database store to run on a user
 *                                machine (user computation)
 * @param {boolean=} opts.isRemote configures the database store to run on a
 *                                 remote machine (central compute node).
 */
function dbRegistryFactory(opts) {
  if (!opts) {
    throw new ReferenceError('missing db-registry opts');
  }

  if (!opts.isLocal && !opts.isRemote) {
    throw new ReferenceError('isLocal or isRemote mode not specified');
  }

  if (!opts.remote || !opts.remote.db) {
    // @note local.db is not required -- no connection info relevant
    throw new ReferenceError([
      'db-registry requires `remote.db` as',
      '`url.format(opts.remote.db)`\'able configuration',
    ].join(' '));
  }

  if (!opts.path) {
    throw new ReferenceError(
      'db-registry requires a `path` attr for db storage'
    );
  }

  if (opts.isLocal) {
    return new DBRegistry(assign({}, {
      localStores: ['projects', 'auth'],
      remoteStoresSyncBoth: ['consortia'],
      remoteStoresSyncIn: [
        /remote-consortium-.*/,
        'coinstac-users',
        'computations',
      ],
      remoteStoresSyncOut: [/local-consortium-.*/],
    }, opts));
  }

  // isRemote
  return new DBRegistry(assign({}, {
    remoteStoresSyncIn: [/local-consortium-.*/],
    remoteStoresSyncBoth: [
      /remote-consortium-.*/,
      /consortia/,
      /computations/,
    ],
  }, opts));
}

/**
 * @todo Rename the factory to `dbRegistryFactory` in this package's root
 * export to differentiate between the factory and the class.
 */
dbRegistryFactory.DBRegistry = DBRegistry;

module.exports = dbRegistryFactory;
