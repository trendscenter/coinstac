'use strict';

const mkdirp = require('mkdirp');
const { promisify } = require('bluebird');

const promisifiedMkdirp = promisify(mkdirp);

/**
 * Upsert COINSTAC user directory.
 *
 * @returns {Promise}
 */
module.exports = function upsertCoinstacUserDir(core) {
  return promisifiedMkdirp(core.appDirectory);
};

