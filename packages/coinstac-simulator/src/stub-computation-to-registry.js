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
  const url = `https://github.com/MRN-Code/${comp.name}`;

  opts.registry.registry.push({
    name: comp.name,
    tags: [comp.version],
    url,
  });

  return opts.registry._doAdd({
    definition: comp,
    name: comp.name,
    url,
    version: comp.version,
  });
};
