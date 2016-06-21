'use strict';

/**
 * @module service/computations-database-syncer
 */

const computationRegistryService = require('./computation-registry');
const dbRegistryService = require('./db-registry');
const spread = require('lodash/spread');

/**
 * Get a computation finder function.
 *
 * @param {Object} target
 * @param {string} target.name
 * @param {string} target.version
 * @returns {Function}
 */
function getComputationFinder(target) {
  return function computationFinder(computation) {
    return (
      computation.name === target.name && computation.version === target.version
    );
  };
}

/**
 * Get computation documents diff.
 *
 * Identifies which decentralized computations from the "golden set" are
 * missing from the computation database's documents, which exist in the db
 * but aren't in the golden set, and those that need to be updated.
 *
 * @private
 *
 * @see ComputationRegistry
 * @see DecentralizedComputation
 *
 * @param {DecentralizedComputation[]} decentralizedComputations "Golden set"
 * of white-listed decentralized computation models
 * @param {Object[]} computationDocs Existing computations in the database
 * @returns {Object} Diff object, where each value set is ready for db
 * `bulkDoc`ing. shape ~= { add:/delete:/update: }
 */
function getComputationsDiff(decentralizedComputations, computationDocs) {
  const toAdd = [];
  const toUpdate = [];

  decentralizedComputations.forEach(computation => {
    const matchingDoc = computationDocs.find(
      getComputationFinder(computation)
    );

    if (!matchingDoc) {
      toAdd.push(computation);
    } else {
      // Ensure the `_id` and `_rev` are added so PouchDB does an update
      toUpdate.push(Object.assign({}, matchingDoc, computation));
    }
  });

  const toDelete = computationDocs.reduce((memo, doc) => {
    if (!decentralizedComputations.some(getComputationFinder(doc))) {
      return memo.concat(Object.assign({}, doc, { _deleted: true }));
    }

    return memo;
  }, []);

  return {
    add: toAdd,
    delete: toDelete,
    update: toUpdate,
  };
}

/**
 * update database with computation diff. diff represents
 * the difference between the server's current database state
 * and the computations requested per the coinstac computation
 * whitelist
 * @private
 * @param {object} diff
 * @returns {Promise} Resolves with diff object
 */
function patchDBWithComputationDiff(diff) {
  const computationsDb = dbRegistryService.get().get('computations');

  return computationsDb.bulkDocs(diff.add)
  .then(() => computationsDb.bulkDocs(diff.update))
  .then(() => computationsDb.bulkDocs(diff.delete))
  .then(() => diff);
}

/**
 * Sync computations with the database.
 *
 * Update the computations db store to match computations as represented by
 * the goldenset/whitelist. The remote ComputationRegistry uses the JSON file
 * as its whitelist.
 *
 * @returns {Promise} Resolves with diff object
 */
function sync() {
  return Promise.all([
    computationRegistryService.get().all(),
    dbRegistryService.get().get('computations').all(),
  ])
  .then(spread(getComputationsDiff))
  .then(patchDBWithComputationDiff);
}

/* eslint-disable object-shorthand */
module.exports = {
  getComputationsDiff: getComputationsDiff,
  patchDBWithComputationDiff: patchDBWithComputationDiff,
  sync: sync,
};
/* eslint-enable object-shorthand */
