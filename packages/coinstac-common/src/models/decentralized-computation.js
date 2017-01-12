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
   * @property {Object[]} [inputs]
   * @property {string} name
   * @property {string} url
   * @property {string} version
   */
  getComputationDocument() {
    const { meta, name, repository: { url }, version } = this.serialize();
    const doc = { meta, name, url, version };

    /**
     * Gather pipeline items' `inputs` arrays and save them in the computation
     * document.
     *
     * @todo This is a temporary hack! It's to facilitate selectable ROIs for
     * Freesurfer analysis. See {@link https://github.com/MRN-Code/coinstac/issues/12}
     * for discussion on computation input/output.
     */
    const inputs = [];

    if (Array.isArray(this.local)) {
      this.local.forEach(localItem => {
        if (DecentralizedComputation.hasInputs(localItem)) {
          inputs.push(localItem.inputs);
        }
      });
    } else if (DecentralizedComputation.hasInputs(this.local)) {
      inputs.push(this.local.inputs);
    }

    if (inputs.length) {
      doc.inputs = inputs;
    }

    return doc;
  }

  /**
   * Does an item have proper `inputs`?
   * @private
   * @static
   *
   * @todo This confirms the shape of an `input`. Change to a joi schema.
   * @throws {Error}
   *
   * @param {Object} localItem
   * @returns {boolean}
   */
  static hasInputs(localItem) {
    if (!(localItem instanceof Object)) {
      throw new Error('Expected arg to be an object');
    }

    return 'inputs' in localItem && Array.isArray(localItem.inputs);
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
  meta: joi.object().keys({
    description: joi.string().required(),
    name: joi.string().required(),
    tags: joi.array().items(joi.string()),
  }).required(),
}, Base.schema);

module.exports = DecentralizedComputation;
