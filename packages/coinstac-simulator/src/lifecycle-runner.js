'use strict';

const isArray = require('lodash/isArray');
const get = require('lodash/get');

/**
 * Runs a lifecycle script as specified in the simulation declaration.
 * @param {string} lifecycleStep preRun/postRun
 * @param {string} type local/remote
 * @returns {Promise}
 */
module.exports = (lifecycleStep, type, decl) => {
  if (!decl) { return Promise.reject(new Error('no declaration found')); }
  let tasks = get(decl, `${type}.${lifecycleStep}`);
  if (!tasks) { return Promise.resolve(); }
  tasks = isArray(tasks) ? tasks : [tasks];
  return Promise.all(tasks);
};
