'use strict';

/**
 * Get a Pouchy database from the database registry that is _likely_ synced.
 *
 * {@link https://pouchdb.com/api.html#replication}
 *
 * @param {DBRegistry} dbRegistry
 * @param {string} name Database name
 * @returns {Promise} Resolves to Pouchy instance
 */
module.exports = function getSyncDatabase(dbRegistry, name) {
  if (!dbRegistry) {
    return Promise.reject(new Error('Requires DBRegistry instance'));
  } if (!name) {
    return Promise.reject(new Error('Requires database name'));
  }

  return new Promise((resolve, reject) => {
    const pouchy = dbRegistry.get(name);
    const { syncEmitter } = pouchy;

    function onSync() {
      /* eslint-disable no-use-before-define */
      syncEmitter.removeListener('error', onError);
      /* eslint-enable no-use-before-define */
      resolve(pouchy);
    }
    function onError(error) {
      pouchy.syncEmitter.removeListener('hasLikelySynced', onSync);
      reject(error);
    }

    /**
     * Pouchy doesn't add a `url` property when the database isn't replicated.
     */
    if (!pouchy.url || pouchy._hasLikelySynced) {
      resolve(pouchy);
    } else {
      syncEmitter.once('hasLikelySynced', onSync);
      syncEmitter.once('error', onError);
    }
  });
};
