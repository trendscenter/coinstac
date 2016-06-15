import { applyAsyncLoading } from './loading.js';
import app from 'ampersand-app';

export const SET_PROJECT = 'SET_PROJECT';
export function setProject(project) {
  return { type: SET_PROJECT, project };
}

/**
 * saves a project (new or existing)
 * @param {object|Project}
 * @returns {Promise}
 */
export const saveProject = applyAsyncLoading(function saveProject(project) {
  return (dispatch) => {
    return app.core.project.save(project)
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

export default function reduce(state = null, action) {
  switch (action.type) {
    case SET_PROJECT:
      if (!action.project) {
        return null; // clear project state
      }
      return Object.assign({}, state, action.project);
    default:
      return state;
  }
}
