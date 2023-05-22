'use strict';

const mkdirp = require('mkdirp');
const pify = require('util').promisify;

const promisifiedMkdirp = pify(mkdirp);

/**
 * Upsert COINSTAC user directory.
 *
 * @returns {Promise}
 */
module.exports = async function upsertCoinstacUserDir(core) {
  await promisifiedMkdirp(core.appDirectory)
  await promisifiedMkdirp(core.imageDirectory)
};
