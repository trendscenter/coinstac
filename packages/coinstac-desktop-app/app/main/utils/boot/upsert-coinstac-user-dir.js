'use strict';

const mkdirp = require('mkdirp');
const pify = require('util').promisify;

const promisifiedMkdirp = pify(mkdirp);

/**
 * Upsert COINSTAC user directory.
 *
 * @returns {Promise}
 */
module.exports = function upsertCoinstacUserDir(core) {
  return promisifiedMkdirp(core.appDirectory);
};
