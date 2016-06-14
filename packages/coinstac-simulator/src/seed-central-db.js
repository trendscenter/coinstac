'use strict';

const Pouchy = require('pouchy');
const dbConf = require('./.pouchdb-server-config');
const url = require('url');
const common = require('coinstac-common');
const Consortium = common.models.Consortium;

/**
 * @private
 * @module seed-central-db
 * @description stubs a dummy consortium and a dummy computation into the
 * infrastructure DBs, which will be consumed by the server and client processes
 * @returns {Promise}
 */
module.exports = {

  seed(declPath) {
    const decl = require(declPath);
    return Promise.all([
      this._seedConsortia(decl),
      this._seedComputations(decl),
    ])
    .then((rslt) => ({ consortia: rslt[0], computations: rslt[1] }));
  },

  _seedConsortia(decl) {
    const consortiaDB = new Pouchy.PouchDB(
      url.format({
        protocol: 'http',
        hostname: 'localhost',
        port: dbConf.port,
        pathname: 'consortia',
      })
    );

    const defaultConsortium = new Consortium({
      _id: 'testconsortiumid' + Date.now(), // eslint-disable-line
      description: 'test-default-consortium',
      label: 'test-default-consortium',
      users: decl.users.map(usr => usr.username),
      owners: decl.users.map(usr => usr.username),
    });

    return consortiaDB.put(defaultConsortium.serialize());
  },

  // @TODO, bypass. let poolers on their own simply `_doAdd` their computations
  // to their computationRegistries
  _seedComputations(decl) {
    const dburl = url.format({
      protocol: 'http',
      hostname: 'localhost',
      port: dbConf.port,
      pathname: 'computations',
    });
    const computationsDB = new Pouchy({ url: dburl });
    const decentralizedComputation = require(decl.computationPath);
    return computationsDB.save({
      _id: 'testcomputationid',
      name: decentralizedComputation.name,
      version: decentralizedComputation.version,
    });
  },
};
