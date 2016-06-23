import { applyAsyncLoading } from './loading.js';
import app from 'ampersand-app';

export const SET_PROJECT = 'SET_PROJECT';
export function setProject(project) {
  return { type: SET_PROJECT, project };
}

export const ADD_FILES_TO_PROJECT = 'ADD_FILES_TO_PROJECT';

/**
 * Add files to project.
 *
 * @param {string} json Collection of file models
 * @returns {Object}
 */
export function addFilesToProject(json = '[]') {
  const files = JSON.parse(json);

  return {
    files,
    type: ADD_FILES_TO_PROJECT,
  };
}

export const REMOVE_FILES_FROM_PROJECT = 'REMOVE_FILES_FROM_PROJECT';

/**
 * Remove files from project.
 *
 * @param {File[]} files Collection of file models
 * @returns {Object}
 */
export function removeFilesFromProject(files) {
  return {
    files,
    type: REMOVE_FILES_FROM_PROJECT,
  };
}

/**
 * saves a project (new or existing)
 * @param {object|Project}
 * @returns {Promise}
 */
export const saveProject = applyAsyncLoading(function saveProject(project) {
  return (dispatch) => {
    return app.core.projects.save(project)
    .catch((err) => {
      app.notify('error', err.message);
      throw err;
    });
  };
});

/**
 * fetches and sets a project
 * @param {string} projectId
 * @param {function} cb
 * @returns {undefined}
 */
export const fetchProject = applyAsyncLoading(function fetchProject(projectId, cb) {
  return (dispatch) => {
    return app.core.dbRegistry.get('projects').get(projectId)
    .then((proj) => {
      dispatch(setProject(proj));
      return proj;
    })
    .catch((err) => {
      app.notify('error', `Unable to fetch project: ${err.message}`);
      throw err;
    });
  };
});

/**
 * Project reducer
 *
 * @param {Project} [project=null] Reducer's piece of state
 * @param {Object} action
 * @param {string[]} action.files
 * @param {string} action.type
 * @returns {(Project|null)}
 */
export default function reduce(project = null, action) {
  const type = action && action.type ? action.type : null;

  // Don't operate on a project when it isn't yet set
  if (!project && type !== SET_PROJECT) {
    return null;
  }

  switch (type) {
    case ADD_FILES_TO_PROJECT:
      return Object.assign({}, project, {
        files: [...project.files, ...action.files],
      });
    case SET_PROJECT:
      if (!action.project) {
        return null; // clear project state
      }
      return Object.assign({}, project, action.project);
    case REMOVE_FILES_FROM_PROJECT:
      return Object.assign({}, project, {
        files: project.files.filter(file => {
          return action.files.every(f => f.filename !== file.filename);
        }),
      });
    default:
      return project;
  }
}
