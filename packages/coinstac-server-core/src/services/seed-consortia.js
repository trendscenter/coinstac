'use strict';

const Consortium = require('coinstac-common/src/models/consortium.js');
const dbRegistryService = require('./db-registry');
const logger = require('./logger.js');

/**
 * @module service/seed-consortia
 */

/**
 * conditionally seeds consortia db
 * @param {object} config server config
 * @returns {Promise} resolves to boolean indicating whether seeding happened or not
 */
/* istanbul ignore next */
module.exports = function seedConsortia(config) {
  let seedDocs;
  if (config.seed && typeof config.seed === 'string') {
    try {
      seedDocs = JSON.parse(config.seed);
    } catch (error) {
      return Promise.reject(error);
    }
  } else {
    seedDocs = config.seed;
  }
  if (!seedDocs || !Array.isArray(seedDocs) || !seedDocs.length) {
    return Promise.resolve(false);
  }
  const consortiaDb = dbRegistryService.get().get('consortia');
  return consortiaDb
  .bulkDocs(seedDocs.map(seedDoc => new Consortium(seedDoc).serialize()))
  .then(() => {
    logger.info('Seeded consortia database');
    return true;
  });
};
