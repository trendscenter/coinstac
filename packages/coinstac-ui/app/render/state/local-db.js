import Dexie from 'dexie';

let db = null;

/**
 * Return the singleton instance of the local db.
 */
function getDatabaseInstance() {
  return db;
}

/**
 * Get a local database by name. Creates a new database in case one with the given name
 * does not exist.
 * @param {string} dbName - Database name (must be unique)
 */
function getOrCreateLocalDatabase(dbName) {
  db = new Dexie(dbName);

  db.version(1).stores({
    runs: 'id, type',
    maps: '[consortiumId+pipelineId], consortiumId',
  });
}

export {
  getOrCreateLocalDatabase,
  getDatabaseInstance,
};
