'use strict';

/**
 * @module project-service
 */

const ModelService = require('../model-service');
const Project = require('coinstac-common').models.Project;
const fileStats = require('../utils/file-stats');
const includes = require('lodash/includes');
const find = require('lodash/find');
const isArray = require('lodash/isArray');

/**
 * @class
 * @extends ModelService
 */
class ProjectService extends ModelService {

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
    /* istanbul ignore else */
    if (!isArray(toAdd)) {
      toAdd = [toAdd];
    }
    // prevent duplicate file adding
    toAdd = toAdd.filter((filename) => {
      return filename && !find(project.files, { filename });
    });

    if (!toAdd.length) { return Promise.resolve(project.files || []); }
    return fileStats.prepare(toAdd)
    .then((files) => {
      project.files = project.files.concat(files);
    })
    .then(() => this.save(project))
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
    if (!isArray(toRemove)) {
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
