'use strict';

/**
 * @private
 * @module stubComputationToRegistry
 */

/**
 * Stubs a DecentralizedComputation to a computation into
 * a computation registry
 * @param {object} opts
 * @param {DecentralizedComputation} opts.computation
 * @param {ComputationRegistry} opts.registry
 * @returns {Promise} resolves when computation stubbed into registry
 */
module.exports = function stubComputationToRegistry(opts) {
  if (!opts) { throw new ReferenceError('opts required'); }
  if (!opts.computation || !opts.registry) {
    throw new ReferenceError('computation & registry requried');
  }
  const comp = opts.computation;
  return opts.registry._doAdd(comp.name, comp.version, comp);
};
