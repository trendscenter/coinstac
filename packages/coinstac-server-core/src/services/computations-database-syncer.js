'use strict';

/**
 * @module service/computations-database-syncer
 */

const computationRegistryService = require('./computation-registry');
const dbRegistryService = require('./db-registry');
const find = require('lodash/find');
const isEqual = require('lodash/isEqual');

module.exports = {

  /**
   * identifies which computations from the golden set are missing from
   * the db, and those that are in the db but missing from the golden list
   * @private
   * @param {array} goldenCompSet computation set whitelisted in coinstac-common
   * @param {array} dbCompSet existing computations in db
   * @returns {object} returns diff object, where each value set is ready for db
   *                           `bulkDoc`ing. shape ~= { add:/delete:/update: }
   */
  _getComputationsDiff(goldenCompSet, dbCompSet) {
    const diff = { add: [], delete: [], update: [] };
    const shouldUpdate = (gDoc, dDoc) => (!isEqual(gDoc.tags, dDoc.tags));
    // find computations to add and update
    goldenCompSet.forEach((gComp) => {
      const dbExisting = find(dbCompSet, { name: gComp.name });
      if (dbExisting) {
        if (shouldUpdate(gComp, dbExisting)) {
          Object.assign(
            gComp,
            {
              /* eslint-disable no-underscore-dangle */
              _id: dbExisting._id,
              _rev: dbExisting._rev,
              /* eslint-enable no-underscore-dangle */
            }
          );
          diff.update.push(gComp);
        }
      } else {
        diff.add.push(gComp);
      }
    });
    // find computations that should be removed
    dbCompSet.forEach((dbComp) => {
      const goldenExisting = find(goldenCompSet, { name: dbComp.name });
      if (!goldenExisting) {
        Object.assign(dbComp, { _deleted: true });
        diff.delete.push(dbComp);
      }
    });
    return diff;
  },

  /**
   * update database with computation diff. diff represents
   * the difference between the server's current database state
   * and the computations requested per the coinstac computation
   * whitelist
   * @private
   * @param {object} diff
   * @returns {Promise}
   */
  _patchDBWithComputationDiff(diff) {
    const dbRegistry = dbRegistryService.get();
    const computationsDb = dbRegistry.get('computations');
    return computationsDb.bulkDocs(diff.add)
    .then(() => computationsDb.bulkDocs(diff.update))
    .then(() => computationsDb.bulkDocs(diff.delete))
    .then(() => Promise.resolve(diff)); // resolve empty
  },

  /**
   * update the computations db store to match computations as represented
   * by the goldenset/whitelist.
   * {@link https://github.com/MRN-Code/coinstac-common/blob/master/src/decentralized-computations.json computation-whitelist}
   * @NOTE remote ComputationRegistries default to using the computation golden-set
   * @returns {Promise} resolves with diff object
   */
  sync() {
    const compReg = computationRegistryService.get();
    const dbRegistry = dbRegistryService.get();
    const comupationsDb = dbRegistry.get('computations');
    return comupationsDb.all()
    .then((dbComps) => this._getComputationsDiff(compReg.registry, dbComps))
    .then((diff) => this._patchDBWithComputationDiff(diff));
  },

};
