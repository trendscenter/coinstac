'use strict';

/**
 * Get a computation finder function.
 *
 * @param {Object} target
 * @param {string} target.name
 * @param {string} target.version
 * @returns {Function}
 */
const getComputationFinder = target => computation => (
  computation.name === target.name && computation.version === target.version
);

/**
 * Get computation documents diff.
 * @private
 *
 * @description Identifies which decentralized computations from the "golden
 * set" are missing from the computation database's documents, which exist in
 * the db but aren't in the golden set, and those that need to be updated.
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

  decentralizedComputations.forEach((computation) => {
    const matchingDoc = computationDocs.find(
      getComputationFinder(computation)
    );

    if (!matchingDoc) {
      toAdd.push(computation.getComputationDocument());
    } else {
      // Ensure the `_id` and `_rev` are added so PouchDB does an update
      toUpdate.push(Object.assign(
        {},
        matchingDoc,
        computation.getComputationDocument()
      ));
    }
  });

  const toDelete = computationDocs.reduce((memo, doc) => {
    if (!decentralizedComputations.some(getComputationFinder(doc))) {
      return memo.concat(Object.assign({}, doc, { _deleted: true }));
    }

    return memo;
  }, []);

  return { toAdd, toDelete, toUpdate };
}

/**
 * Sync computations with the database.
 *
 * Update the computations db store to match computations as represented by
 * the goldenset/whitelist. The remote ComputationRegistry uses the JSON file
 * as its whitelist.
 *
 * @param {Pouchy} computationsDatabase
 * @param {DecentralizedComputation[]} decentralizedComputations
 * @returns {Promise}
 */
function sync(computationsDatabase, decentralizedComputations) {
  return computationsDatabase.all()
    .then((computationDocs) => {
      const { toAdd, toDelete, toUpdate } = getComputationsDiff(
        decentralizedComputations,
        computationDocs
      );

      return computationsDatabase.bulkDocs(
        toAdd.concat(toDelete, toUpdate)
      );
    })
    .then((responses) => {
      /**
       * Ensure bulkDocs's response doesn't contain an error.
       * {@link https://pouchdb.com/api.html#batch_create}
       */
      const error = responses.find(r => r.error);

      if (error) {
        throw new Error(
          `Error synchronizing computation documents: ${error.message}`
        );
      }
    });
}

module.exports = {
  getComputationsDiff,
  sync,
};

