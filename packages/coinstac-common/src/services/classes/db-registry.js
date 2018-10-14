'use strict';

const path = require('path');
const Pouchy = require('pouchy');
// Pouchy.PouchDB.debug.enable('*');
const url = require('url');
const assign = require('lodash/assign');
const cloneDeep = require('lodash/cloneDeep');
const defaultsDeep = require('lodash/defaultsDeep');
const get = require('lodash/get');
const without = require('lodash/without');
const result = require('lodash/result');

/**
 * @private
 * @function arrHasEmbeddedMatch
 * @description tests if an array has a match embedded in its items
 * @param {array} arr
 * @param {string} str
 * @return {boolean}
 */
const arrHasEmbeddedMatch = (arr, str) => arr.some(toMatch => str.match(toMatch));

/**
 * @class DBRegistry
 * @private
 * @note use the db-registry module/service to obtain an env specific
 * db-registry instance.  this class is for _internal_ consumption only
 *
 * @example
 * const registry = DBRegistry({
 *    isRemote: true, // configure for compute/server instance
 *    dir: appDirectory,
 *    remoteStoresSyncIn: ['local-results'],
 *    remoteStoresSyncBoth: ['remote-results']
 * });
 *
 * @param {object} opts
 * @param {string} opts.path path to fs dir where dbs will be stored
 * @param {object} opts.remote Pouchy defaults applied to remote db instantiations
 * @param {object=} opts.local Pouchy defaults applied to local db instantiations
 * @param {array=} opts.localStores strings/regexes used to configure Pouch syncronization
 * @param {array=} opts.remoteStoresSyncBoth strings/regexes used to configure Pouch syncronization
 * @param {array=} opts.remoteStoresSyncIn strings/regexes used to configure Pouch syncronization
 * @param {array=} opts.remoteStoresSyncOut strings/regexes used to configure Pouch syncronization
 * @param {object=} opts.pouchConfig default PouchDB config applied to all pouchy instances
 * @param {boolean} opts.noURLPrefix option to disable prefixing remote db urls [default false]
 * @param {Function|object} [opts.ajax] object or function to be applied to each db request
 * @property {object} dbs
 * @property {array} dbs.all all db instances in the registry
 * @property {object} dbs.registry all db instances indexed by name/url
 * @property {array} names convenience prop to access list of current db names
 */
class DBRegistry {
  constructor(opts) {
    assign(this, opts);
    this.all = [];
    this.registry = {};
    if (!this.remote || !this.remote.db) {
      throw new ReferenceError([
        'DBRegistry `remote.db` as',
        '`url.format(opts.remote.db)`\'able configuration',
      ].join(' '));
    }
  }

  /**
   * gets an existing or new instance of a db
   * @param  {string} nameOrUrl name of db or url to remote db
   * @param {object=} opts passed directly to `.register`.  see `.register` for more
   * @return {Pouchy}
   */
  get(nameOrUrl, _opts) {
    const opts = Object.assign({}, _opts);
    /* istanbul ignore if */
    if (nameOrUrl.match(/^http/) || nameOrUrl.match(/^\//)) {
      opts.url = nameOrUrl;
    } else {
      opts.name = nameOrUrl;
    }

    if (this.registry[nameOrUrl]) {
      return this.registry[nameOrUrl];
    }

    return this.register(opts);
  }

  /**
   * @private
   */
  isBidirectionalSyncStore(connStr) {
    return (
      this.remoteStoresSyncBoth
      && arrHasEmbeddedMatch(this.remoteStoresSyncBoth, connStr)
    );
  }

  /**
   * @private
   */
  isLocalStore(connStr) {
    return this.localStores && arrHasEmbeddedMatch(this.localStores, connStr);
  }

  /**
   * @private
   */
  isSyncInStore(connStr) {
    return (
      this.remoteStoresSyncIn
      && arrHasEmbeddedMatch(this.remoteStoresSyncIn, connStr)
    );
  }

  /**
   * @private
   */
  isSyncOutStore(connStr) {
    return (
      this.remoteStoresSyncOut
      && arrHasEmbeddedMatch(this.remoteStoresSyncOut, connStr)
    );
  }

  /**
   * Register an app-level datastore.
   * @note remote url configurations stored on `this.remote` are not purely used
   * to generate Couch/Pouch request endpoints with the db name.  The pathname is
   * prefixed with an `'up/'` or `'down/' prior to `url.format(...)` such that
   * the coinstac-storage-proxy may intercept requests and perform auth/validation.
   * this prefixing occurs _only_ in `isLocal` mode.  `isRemote` mode implies
   * that the registry is working securely behind COINS infrastructure, and can
   * hit the Couch API directly, bypassing the proxy
   * @param  {object} opts      Required options for a Pouchy instance
   * @param  {string=} opts.name Store's registered name.
   *                             Should match a store array passed to constructor)
   * @param  {string=} opts.url  Store's URL
   * @returns {Pouchy}           Database instance
   */
  register(opts) {
    const conf = cloneDeep(opts);
    const rootRemoteDBPathname = get(this, 'remote.db.pathname') || '';
    const connStr = conf.name || conf.url;
    const syncDefaults = { live: true, retry: true, heartbeat: 5000 };
    conf.path = conf.path || this.path;
    conf.pouchConfig = conf.pouchConfig || {};
    // assert that db can register, and configure its domain
    if (this.isLocalStore(connStr)) {
      defaultsDeep(conf, this.local);
    } else if (this.isBidirectionalSyncStore(connStr)) {
      defaultsDeep(conf, this.remote);
      conf.replicate = { sync: defaultsDeep({}, this.replicationOpts, syncDefaults) };
      conf.url = conf.url || url.format(
        assign(
          {},
          this.remote.db,
          { pathname: path.join(rootRemoteDBPathname, conf.name) }
        ) // never up/down prefix dual-dir stores
      );
    } else if (this.isSyncInStore(connStr)) {
      defaultsDeep(conf, this.remote);
      conf.replicate = { in: defaultsDeep({}, this.replicationOpts, syncDefaults) };
      conf.url = conf.url || url.format(
        assign({}, this.remote.db, {
          pathname: `${rootRemoteDBPathname}/${conf.name}`,
        })
      );
    } else if (this.isSyncOutStore(connStr)) {
      defaultsDeep(conf, this.remote);
      conf.replicate = { out: defaultsDeep({}, this.replicationOpts, syncDefaults) };
      conf.url = conf.url || url.format(
        assign({}, this.remote.db, {
          pathname: `${rootRemoteDBPathname}/${conf.name}`,
        })
      );
    } else {
      /* istanbul ignore next */
      throw new ReferenceError(
        `database ${connStr} does not fit local or remote database variants`
      );
    }
    if (this.pouchConfig) {
      conf.pouchConfig = defaultsDeep(this.pouchConfig, conf.pouchConfig);
    }

    conf.pouchConfig.ajax = result(this, 'ajax');

    /**
     * Ensure local (client) instances' databases are stored in
     * memory. This excludes projects and local consortium results.
     *
     * {@link https://github.com/MRN-Code/coinstac/issues/155}
     */
    if (
      this.localStores
      && conf.pouchConfig.getAdapter instanceof Function
    ) {
      conf.pouchConfig.adapter = conf.pouchConfig.getAdapter(connStr);
    }

    // build db and cache it
    const db = new Pouchy(conf);
    this.registry[conf.name || conf.url] = db;
    this.all.push(db);
    return db;
  }

  /**
   * Removes database from registry optionally deleting it from pouchy
   * @param  {boolean} deleteDB call pouchy destroy on DB
   * @param  {Pouchy|string} db database or database name
   * @param  {function=} cb
   * @return {Promise}
   */
  cleanUpDB(deleteDB, db) {
    /* istanbul ignore if */
    if (typeof db === 'string') {
      db = this.all.find(pouchy => pouchy.name === db);
    }
    /* istanbul ignore if */
    if (!db) {
      throw new ReferenceError(`db "${name}" not found. unable to remove`);
    }
    /* istanbul ignore else */
    if (db.syncEmitter) { db.syncEmitter.cancel(); }
    const unregister = () => {
      this.all = without(this.all, db);
      delete this.registry[db.name];
    };
    return Promise.all([
      deleteDB ? db.destroy() : undefined,
      unregister(),
    ]);
  }

  destroy(opts) {
    const options = opts || {};
    return Promise.all(this.all.map(this.cleanUpDB.bind(this, options.deleteDBs)))
      .then((destroyed) => {
        const notDestroyed = destroyed.filter(confirmation => (confirmation[0] ? !confirmation[0].ok : false));
        /* istanbul ignore if */
        if (notDestroyed.length) {
          throw new Error('unable to destroy all dbs');
        }
        this.destroyed = true;
        return destroyed;
      });
  }
}

/**
* @property {array} names returns an array of db names from the registry
* @example `dbs.names;` ==> ['db1', 'db2']
*/
Object.defineProperty(DBRegistry.prototype, 'names', {
  get() {
    /* istanbul ignore next */
    return this.all.map(db => db.name);
  },
  enumerable: true,
});

DBRegistry.Pouchy = Pouchy;

module.exports = DBRegistry;
