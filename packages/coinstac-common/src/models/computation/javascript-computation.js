'use strict';

const joi = require('joi');
const Computation = require('./computation.js');

/**
 * @class JavascriptComputation
 * @constructor
 * @extends Computation
 * @property {function} fn computation function
 * @property {string} type always "function"
 */
class JavascriptComputation extends Computation {
  /**
   * @description run a js computation
   * @param {object} opts
   * @returns {Promise}
   */
  run(opts) {
    return Promise.resolve(this.fn(opts));
  }
}

JavascriptComputation.schema = Object.assign({
  fn: joi.func().arity(1).required(),
  type: joi.string().valid('function').required(),
}, Computation.schema);

module.exports = JavascriptComputation;
