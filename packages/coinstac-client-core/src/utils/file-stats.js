/**
 * @module project-files
 * @description utilities to perform file io, primarily to support projects.
 * `files` should not generally be used publically, unless absolutely necessary.
 * Use the `projects` lib in order to access files.
 */

'use strict';

const compact = require('lodash/compact');
const flatten = require('lodash/flatten');
const fs = require('fs');
const path = require('path');
const sha = require('sha');
const bluebird = require('bluebird');

const readdirAsync = bluebird.promisify(fs.readdir, { context: fs });
const statAsync = bluebird.promisify(fs.stat, { context: fs });
const shaAsync = bluebird.promisify(sha.get, { context: sha });

/**
 * generate simple file stat object for a provided filename
 *
 * @param {string} path Directory or file path
 * @param {boolean} [recurse=false] Recurse if path is a directory. Will only
 * recurse once.
 * @returns {Promise} Resolves to a file object, array of file objects, or
 * `undefined`
 */
function buildBasicStat(filepath, recurse = false) {
  return statAsync(filepath).then((stats) => {
    if (stats.isDirectory() && recurse) {
      return readdirAsync(filepath).then(files => Promise.all(
        files.map(f => buildBasicStat(path.join(filepath, f)))
      ));
    } else if (stats.isFile() && path.basename(filepath)[0] !== '.') {
      return {
        filename: filepath,
        modified: stats.mtime.getTime(),
        size: stats.size,
        tags: {},
      };
    }
  });
}

module.exports = {
  /**
   * @private
   */
  _buildBasicStat: buildBasicStat,

  /**
   * append file sha to file meta object
   * @private
   * @param {object} fileMeta
   * @returns {Promise}
   */
  _appendSha(fileMeta) {
    return shaAsync(fileMeta.filename)
    .then(rSha => Object.assign(fileMeta, { sha: rSha }));
  },

  /**
   * Post-processes file paths by adding stat and sha meta to an obj
   * representation of the passed file(s)
   * @param {array} filenames
   * @returns {Promise}
   */
  prepare(filenames) {
    filenames = filenames || [];
    return Promise.all(filenames.map(f => buildBasicStat(f, true)))
      .then(flatten)
      .then(compact)
      .then((filesStats) => {
        return Promise.all(filesStats.map(this._appendSha.bind(this)));
      });
  },

};
