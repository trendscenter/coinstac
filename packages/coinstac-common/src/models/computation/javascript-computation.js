'use strict';

const Computation = require('./computation.js');
const util = require('util');
const joi = require('joi');

/**
 * @class JavascriptComputation
 * @constructor
 * @extends Computation
 * @property {function} fn computation function
 * @property {string} type always "function"
 */
function JavascriptComputation() {
  Computation.apply(this, arguments); // eslint-disable-line
}

util.inherits(JavascriptComputation, Computation);

/**
 * @description run a js computation
 * @param {object} opts
 * @returns {Promise}
 */
JavascriptComputation.prototype.run = function run(opts) {
  return Promise.resolve(this.fn(opts));
};

JavascriptComputation.schema = Object.assign({
  fn: joi.func().arity(1).required(),
  type: joi.string().valid('function').required(),
}, Computation.schema);

module.exports = JavascriptComputation;
