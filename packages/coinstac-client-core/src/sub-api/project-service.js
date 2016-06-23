'use strict';

/**
 * @module project-service
 */

const ModelService = require('../model-service');
const Project = require('coinstac-common').models.Project;
const fileStats = require('../utils/file-stats');
const includes = require('lodash/includes');
const find = require('lodash/find');

/**
 * @class
 * @extends ModelService
 */
class ProjectService extends ModelService {

  /**
   * Get file stats.
   *
   * @param {(string|string[])} filenames Collection (or single) full file paths
   * @returns {Promise} Resolves to serialized File model(s)
   */
  getFileStats(filenames) {
    return fileStats.prepare(
      Array.isArray(filenames) ? filenames : [filenames]
    );
  }

  modelServiceHooks() {
    return {
      dbName: 'projects',
      ModelType: Project,
    };
  }

  /**
   * adds a file (or set of files) to a project.  persists on update
   * @param {Project|object} project
   * @param {string|string[]} toAdd
   * @returns {Promise}
   */
  addFiles(project, toAdd) {
    let localToAdd = Array.isArray(toAdd) ? toAdd : [toAdd];

    // prevent duplicate file adding
    localToAdd = localToAdd.filter((filename) => {
      return filename && !find(project.files, { filename });
    });

    if (!localToAdd.length) {
      return Promise.resolve(project.files || []);
    }

    return this.getFileStats(localToAdd)
      .then((files) => {
        project.files = project.files.concat(files);
        return this.save(project);
      })
      .then((doc) => Object.assign(project, doc))
      .then(() => project.files);
  }

  /**
   * removes a file (or set of files) from a project.  persists on update
   * @param {Project|object} project
   * @param {string|string[]} toRemove
   * @returns {Promise}
   */
  removeFiles(project, toRemove) {
    /* istanbul ignore else */
    if (Array.isArray(toRemove)) {
      toRemove = [toRemove];
    }

    project.files = project.files.filter((existing) => {
      return !includes(toRemove, existing.filename);
    });
    return this.save(project)
    .then((doc) => Object.assign(project, doc))
    .then(() => project.files);
  }

}

module.exports = ProjectService;
