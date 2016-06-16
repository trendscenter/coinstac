/**
 * Computation registry test helpers.
 *
 * These are used for testing the computation registry class and factory.
 */
'use strict';

const mkdirp = require('mkdirp');
const ncp = require('ncp');
const path = require('path');
const rimraf = require('rimraf');

/**
 * Mock computation path.
 *
 * Path to the mock computation directories.
 *
 * @type {string}
 */
const MOCK_COMPUTATION_PATH = path.join(
    __dirname, '..', 'mocks', 'computation-definitions'
);

/**
 * Test computation path.
 *
 * Path to the test path, where the tests write computation definitions to disk.
 *
 * @type {string}
 */
const TEST_COMPUTATION_PATH = path.join(__dirname, '..', '..', '.tmp');

/**
 * Remote the test computation path.
 *
 * @returns {Promise}
 */
function cleanupTestDir() {
  return new Promise((resolve, reject) => {
    rimraf(TEST_COMPUTATION_PATH, error => {
      return error ? reject(error) : resolve(TEST_COMPUTATION_PATH);
    });
  });
}

/**
 * @todo  Better name.
 *
 * @param {(string|string[])} slugs Collection of <name>@<version> slugs to
 * copy. These should match directory names in
 * /test/mocks/computation-definitions/
 * @returns {Promise}
 */
function setupTestDir(slugs) {
  if (typeof slugs === 'undefined') {
    throw new TypeError('Requires one or more <name>@<version> slugs');
  }

  if (typeof slugs === 'string') {
    slugs = [slugs];
  }

  return Promise.all(slugs.map(slug => {
    const sourceDir = path.join(MOCK_COMPUTATION_PATH, slug);
    const targetDir = path.join(TEST_COMPUTATION_PATH, slug);
    return new Promise((resolve, reject) => {
      mkdirp(targetDir, error => {
        if (error) { return reject(error); }
        return ncp(sourceDir, targetDir, error => {
          if (error) { return reject(error); }
          return resolve();
        });
      });
    });
  }));
}

module.exports = {
  cleanupTestDir,
  MOCK_COMPUTATION_PATH,
  setupTestDir,
  TEST_COMPUTATION_PATH,
};
