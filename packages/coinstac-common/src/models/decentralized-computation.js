'use strict';

const Base = require('./base.js');
const joi = require('joi');

/**
 * @class DecentralizedComputation
 * @constructor
 * @extends Base
 * @description
 * Primarly serves as a schema for how DecentralizedComputations are published
 * and represented internally in datastores.
 * @param {object} opts
 * @param {string} opts.name what do we call this computation?
 * @param {string} opts.repository URL to repo where computation hosted
 * @param {string} opts.version e.g. x.x.x, 1.2.4. git version or semver tags preferred
 * @param {string} opts.local raw `Pipeline` definition
 * @param {string} opts.remote raw `Pipeline` definition
 * @param {(string|function)=} opts.setup command to run to prepare your computation in
 *                                 environments in which it will be run
 * @param {string=} opts.cwd will be squashed by system
 */
class DecentralizedComputation extends Base {
  /**
   * Get a serialized model suitable for saving in the 'computations' database.
   *
   * @returns {Object} Serialized model
   * @property {string} name
   * @property {string} url
   * @property {string} version
   */
  getComputationDocument() {
    const { name, repository: { url }, version } = this.serialize();

    return { name, url, version };
  }
}

DecentralizedComputation.schema = Object.assign({
  cwd: joi.string().min(2),
  name: joi.string().min(2).required(),
  plugins: joi.array().items(joi.string()),
  setup: joi.alternatives().try(
    joi.string(),
    joi.func()
  ),
  repository: joi.object().keys({
    url: joi.string().uri().min(9),
  }),
  version: joi.string().min(5).required(), // x.x.x
  local: joi.alternatives().try(
    joi.object().required(),
    joi.array().required()
  ).required(),
  remote: joi.alternatives().try(
    joi.object().required(),
    joi.array().required()
  ).required(),
}, Base.schema);

module.exports = DecentralizedComputation;
