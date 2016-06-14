'use strict';

const bluebird = require('bluebird');

/**
 * @module teardown-auth
 */

/**
 * logs out and clear credential cache
 * @param {CoinstacClient} coinstacClient
 * @param {function} cb cb(err, rslt). `rslt` _is not guaranteed_
 *
 */
module.exports.teardownAuth = (coinstacClient, cb) => {
  const p = coinstacClient.auth.logout();
  return bluebird.resolve(p).asCallback(cb);
};
