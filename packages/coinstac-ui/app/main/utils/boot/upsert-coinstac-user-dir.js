'use strict';

const app = require('ampersand-app');
const mkdirp = require('mkdirp');
const { promisify } = require('bluebird');

const promisifiedMkdirp = promisify(mkdirp);

/**
 * Upsert COINSTAC user directory.
 *
 * @returns {Promise}
 */
module.exports = function upsertCoinstacUserDir() {
  return promisifiedMkdirp(app.core.appDirectory);
};

