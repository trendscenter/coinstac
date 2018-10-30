'use strict';

const joi = require('joi');
const isArray = require('lodash/isArray');
const assign = require('lodash/assign');
const Base = require('../base.js');

/**
 * @abstract
 * @constructor
 * @extends Base
 * @class Computation
 * @description Base class for framing various types of computation or task
 * runners.  Enables a declaritive definition for computation.  See Computation
 * child classes for practical applications.
 * @property {string} cwd directory to run computation from
 * @property {string} type declared computation type
 * @property {Computation} next enable Computation consumers (e.g. a Pipeline)
 *                              ability to determine if this computation is
 *                              ultimately complete, s.t. a pipleline may
 *                              progress
 */
class Computation extends Base {
  /**
   * @static
   * @description produces Computation sub-types provided raw computations
   * @param {object|array} comps raw computations
   * @param {object=} opts settings to apply onto each Computation
   * @return {Computation[]}
   */
  static factory(comps, opts) {
    let rawComps = isArray(comps) ? comps : [comps];
    rawComps = opts ? rawComps.map(raw => assign(raw, opts)) : rawComps;

    // Dynamically require to prevent cyclic dependencies
    /* eslint-disable global-require */
    const JavascriptComputation = require('./javascript-computation');
    const CommandComputation = require('./command-computation');
    /* eslint-enable global-require */

    return rawComps.map((comp) => {
      const { type } = comp;
      switch (type) {
        case 'function':
          return new JavascriptComputation(comp);
        case 'cmd':
          return new CommandComputation(comp);
        default:
          throw new ReferenceError(`unable to instantiate ${type} computation`);
      }
    });
  }

  /**
   * @abstract
   * @throws {ReferenceError} must be extended by sub-types
   */
  run() { // eslint-disable-line class-methods-use-this
    throw new ReferenceError([
      'Computation is an abstract class.  Run must be extended',
      'by sub-classes',
    ].join(' '));
  }
}

Computation.schema = Object.assign({
  cwd: joi.string().min(2).required(),
  type: joi.string().min(2).required(),
  next: joi.object().type(Computation),
  verbose: joi.boolean().default(false),
  inputs: joi.array().items(joi.object()),
}, Base.schema);

module.exports = Computation;
