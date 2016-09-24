'use strict';

/**
 * @module project-service
 */

const ModelService = require('../model-service');
const Project = require('coinstac-common').models.Project;
const bluebird = require('bluebird');
const coinstacCommon = require('coinstac-common');
const csvParse = require('csv-parse');
const fileStats = require('../utils/file-stats');
const fs = require('fs');
const path = require('path');
const camelCase = require('lodash/camelCase');
const difference = require('lodash/difference');
const find = require('lodash/find');
const includes = require('lodash/includes');

/**
 * @class
 * @extends ModelService
 * @property {Map} projects Collection of project IDs to remote database names
 * @property {Map} listeners Collection of remote database names to `DBListener`
 * instances
 */
class ProjectService extends ModelService {
  constructor(opts) {
    super(opts);

    this.projects = new Map();
    this.listeners = new Map();
  }

  getCSV(filename) {
    return bluebird.promisify(fs.readFile)(filename)
      .then(data => bluebird.promisify(csvParse)(data.toString()))
      .then(JSON.stringify);
  }

  /**
   * Set meta contents to a project's files.
   *
   * @todo Refactor this into model method?
   *
   * @param {string} projectId
   * @param {Map} metaContents Retrieved from `getMetaFileContents`
   * @returns {Promise} Mutated project with meta content as file tags
   */
  setMetaContents(projectId) {
    if (!projectId) {
      return Promise.reject(new Error('Project ID required'));
    }

    return this.get(projectId)
      .then(project => {
        if (!project.consortiumId) {
          throw new Error(
            `No active consortium set of project ${projectId}`
          );
        }

        return Promise.all([
          project,
          this.dbRegistry.get('consortia').get(project.consortiumId),
        ]);
      })
      .then(([project, consortium]) => {
        const covariates = consortium.activeComputationInputs[0][2];

        if (!Array.isArray(covariates) || !covariates.length) {
          throw new Error('Expected covariates');
        }

        /**
         * [
         *   [1, 2, 3],
         *   [4, 5, 6],
         * ]
         */
        const metaFile = project.metaFile;

        // [undefined, <covariateIndex>, <covariateIndex>, ....]
        const metaCovariateMapping = project.metaCovariateMapping;

        function getTags(metaRow) {
          return covariates.reduce((tags, { name, type }, covariateIndex) => {
            const raw = metaRow[metaCovariateMapping.indexOf(covariateIndex)];
            let value;

            if (type === 'number') {
              value = parseFloat(raw, 10);
            } else if (type === 'boolean') {
              const num = parseInt(raw, 10);
              const low = raw.toLowerCase();

              if (!Number.isNaN(num)) {
                value = !!num;
              } else if (low === 't' || low === 'true') {
                value = true;
              } else if (low === 'f' || low === 'false') {
                value = false;
              }
            }

            if (typeof value === 'undefined') {
              throw new Error('Couldn\'t determine column value!');
            }

            tags[camelCase(name)] = value;

            return tags;
          }, {});
        }

        project.files.forEach(file => {
          const metaRow = metaFile.find(row => {
            const filename = row[0];
            return (
              filename === file.filename ||
              filename === path.basename(file.filename)
            );
          });

          if (!metaRow) {
            throw new Error(`Couldn't find meta info for file ${file.filename}`);
          }

          Object.assign(file.tags, getTags(metaRow));
        });

        return this.save(project);
      });
  }

  /**
   * Destroy database listeners.
   *
   * @returns {Promise}
   */
  destroyListeners() {
    this.projects.clear();

    return Promise.all([
      this.removeUnusedListeners(),
      this.listeners.get(ProjectService.PROJECTS_LISTENER).destroy(),
    ]);
  }

  /**
   * Get consortium ID.
   * @private
   *
   * Get a project's consortium ID.
   *
   * @param {string} projectId
   * @returns {Promise}
   */
  getConsortiumId(projectId) {
    return this.get(projectId).then(({ consortiumId }) => consortiumId);
  }

  /**
   * Get database listener.
   * @private
   *
   * @param {Object} options
   * @param {Function} options.callback
   * @param {string} options.consortiumId
   * @param {string} options.projectId
   * @returns {DBListener} Wired up `DBListener` instance
   */
  getDBListener({ callback, consortiumId, projectId }) {
    if (!consortiumId) {
      throw new Error('Consortium ID required');
    } else if (!callback || !(callback instanceof Function)) {
      throw new Error('Callback function required');
    }

    // Deep props are unfortunately necessary for testing:
    const dbListener = new coinstacCommon.helpers.DBListener(
      this.dbRegistry.get(`remote-consortium-${consortiumId}`)
    );

    dbListener.on('change', ({ doc }) => {
      this.handleRemoteResultChange({
        callback,
        consortiumId,
        doc,
        projectId,
      });
    });
    dbListener.on('delete', ({ doc }) => {
      this.handleRemoteResultDelete({
        callback,
        consortiumId,
        doc,
        projectId,
      });
    });

    return dbListener;
  }

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

  /**
   * Handle project document change.
   * @private
   *
   * @param {Object} doc
   * @param {Function} callback
   * @returns {Promise}
   */
  handleProjectChange(doc, callback) {
    const { listeners, projects } = this;
    const { _id: projectId } = doc;

    return this.getConsortiumId(projectId).then(consortiumId => {
      const oldConsortiumId = projects.get(projectId);
      let dbListener;

      if (consortiumId) {
        projects.set(projectId, consortiumId);

        if (!listeners.has(consortiumId)) {
          dbListener = this.getDBListener({
            callback,
            consortiumId,
            projectId,
          });

          listeners.set(consortiumId, dbListener);
        } else {
          dbListener = listeners.get(consortiumId);
        }

        if (oldConsortiumId && consortiumId !== oldConsortiumId) {
          return this.removeUnusedListeners().then(() => dbListener);
        }
      }

      return dbListener;
    });
  }

  /**
   * Handle project deletion.
   * @private
   *
   * @param {Object} doc
   * @returns {Promise}
   */
  handleProjectDelete(doc) {
    const { _id: projectId } = doc;

    this.projects.delete(projectId);

    return this.removeUnusedListeners().then(() => projectId);
  }

  /**
   * Handle remote result document changes.
   * @private
   *
   * @param {Object} options
   * @param {Function} options.callback Node-style callback
   * @param {string} options.consortiumId
   * @param {Object} options.doc
   * @param {string} options.projectId
   */
  handleRemoteResultChange({ callback, consortiumId, doc, projectId }) {
    callback(null, { consortiumId, doc, projectId });
  }

  /**
   * Handle remote result document deletion.
   * @private
   *
   * @param {Object} options
   * @param {Function} options.callback
   * @param {string} options.consortiumId
   * @param {Object} options.doc
   * @param {string} options.projectId
   */
  handleRemoteResultDelete({ callback, consortiumId, doc, projectId }) {
    callback(null, { consortiumId, doc, projectId });
  }

  modelServiceHooks() {
    return {
      dbName: 'projects',
      ModelType: Project,
    };
  }

  /**
   * Initialize database listeners.
   *
   * @param {Function} callback
   * @returns {Promise}
   */
  initializeListeners(callback) {
    if (!callback || !(callback instanceof Function)) {
      return Promise.reject(new Error('Callback function required'));
    }

    const { dbRegistry, listeners, projects } = this;

    const projectsDb = dbRegistry.get('projects');
    const projectsDbListener = new coinstacCommon.helpers.DBListener(
      projectsDb
    );

    projectsDbListener.on('change', ({ doc }) => {
      this.handleProjectChange(doc, callback)
        .catch(error => callback(error));
    });
    projectsDbListener.on('delete', ({ doc }) => {
      this.handleProjectDelete(doc, callback)
        .catch(error => callback(error));
    });

    listeners.set(ProjectService.PROJECTS_LISTENER, projectsDbListener);

    return projectsDb.all()
      .then(projectDocs => {
        projectDocs.forEach(({ _id: projectId, consortiumId }) => {
          if (consortiumId) {
            const dbListener = this.getDBListener({
              callback,
              consortiumId,
              projectId,
            });

            projects.set(projectId, consortiumId);
            listeners.set(consortiumId, dbListener);
          }
        });
      });
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

  /**
   * Remove unused database listeners.
   * @private
   *
   * @returns {Promise}
   */
  removeUnusedListeners() {
    const { listeners, projects } = this;

    const toDelete = difference(
      Array.from(listeners.keys()),

      // The 'good' list. Don't delete the 'projects' listener:
      Array.from(projects.values()).concat(ProjectService.PROJECTS_LISTENER)
    );

    return Promise.all(toDelete.map(consortiumId => {
      const destroy = listeners.get(consortiumId).destroy();
      listeners.delete(consortiumId);
      return destroy;
    }));
  }
}

/**
 * Projects listener symbol.
 * @private
 *
 * @const {Symbol}
 */
ProjectService.PROJECTS_LISTENER = Symbol('PROJECTS_LISTENER');

module.exports = ProjectService;
