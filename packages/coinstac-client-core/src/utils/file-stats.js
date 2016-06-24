/**
 * @module project-files
 * @description utilities to perform file io, primarily to support projects.
 * `files` should not generally be used publically, unless absolutely necessary.
 * Use the `projects` lib in order to access files.
 */
'use strict';

const fs = require('fs');
const sha = require('sha');
const bluebird = require('bluebird');

const statAsync = bluebird.promisify(fs.stat, { context: fs });
const shaAsync = bluebird.promisify(sha.get, { context: sha });

module.exports = {

  /**
   * generate simple file stat object for a provided filename
   * @private
   * @param {string} filename
   * @returns {Promise}
   */
  _buildBasicStat(filename) {
    return statAsync(filename)
    .then((stat) => ({
      filename,
      size: stat.size,
      modified: stat.mtime.getTime(),

      /**
       * @todo The `isControl` tag is hard-coded to demo the
       * decentralized-laplacian-ridge-regression computation. Determine a
       * method for informing the UI of a computation's required tags and
       * letting the user apply them.
       */
      tags: {
        isControl: filename.indexOf('controls') > -1 ? true : false,
      },
    }));
  },

  /**
   * append file sha to file meta object
   * @private
   * @param {object} fileMeta
   * @returns {Promise}
   */
  _appendSha(fileMeta) {
    return shaAsync(fileMeta.filename)
    .then((rSha) => Object.assign(fileMeta, { sha: rSha }));
  },

  /**
   * Post-processes file paths by adding stat and sha meta to an obj
   * representation of the passed file(s)
   * @param {array} filenames
   * @returns {Promise}
   */
  prepare(filenames) {
    filenames = filenames || [];
    return Promise.all(filenames.map(this._buildBasicStat.bind(this)))
    .then((stats) => Promise.all(stats.map(this._appendSha.bind(this))));
  },

};
