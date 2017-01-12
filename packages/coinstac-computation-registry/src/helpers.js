'use strict';

const readPkgUp = require('read-pkg-up');

module.exports = {
  /**
   * Get contents of first package.json up the directory tree.
   *
   * @param {string} cwd
   * @returns {Promise<(Object|null),Error>}
   */
  getPackage(cwd) {
    return readPkgUp({ cwd }).then(result => result.pkg);
  },
};
