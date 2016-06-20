import { applyAsyncLoading } from './loading.js';
import app from 'ampersand-app';

export const ADD_PROJECT = 'ADD_PROJECT';
export const _addProject = (project) => ({ type: ADD_PROJECT, project });

export const SET_PROJECTS = 'SET_PROJECTS';
export const setProjects = (projects) => ({ type: SET_PROJECTS, projects });

export const REMOVE_PROJECT = 'REMOVE_PROJECT';
export const removeProject = (project) => ({ type: REMOVE_PROJECT, project });

export const addProject = applyAsyncLoading(function addProject(project) {
  return (dispatch) => {
    return app.core.projects.save(project)
      .then((proj) => {
        app.notify('success', `Project '${project.name}' created`);
        dispatch(_addProject(project));
        return proj;
      });
  };
});

export const remove = applyAsyncLoading(function remove(project) {
  return (dispatch) => {
    return app.core.projects.delete(project)
    .then((rslt) => {
      app.notify('success', `Project '${project.name}' removed`);
      dispatch(removeProject(project));
      return rslt;
    })
    .catch((err) => {
      app.notify('error', err.message);
      throw err;
    });
  };
});

export const fetch = applyAsyncLoading(function fetchProjects(cb) {
  return (dispatch) => {
    return app.core.projects.all()
      .then(projects => {
        dispatch(setProjects(projects));
        cb(null, projects);
      })
      .catch(error => {
        cb(error);
      });
  };
});

/**
 * Projects reducer.
 *
 * @param {Project[]} [projects]
 * @param {Object} action
 * @param {string} action.type One of the projects' actions
 * @param {Project} action.project
 * @param {Projects[]} action.projects ?
 * @returns {Project[]}
 */
export default function reducer(projects = [], action) {
  switch (action.type) {
    case ADD_PROJECT:
      return projects.concat(action.project);
    case SET_PROJECTS:
      if (!action.projects) {
        return projects;
      }
      return [...action.projects];
    case REMOVE_PROJECT:
      return projects.filter(p => p.name !== action.project.name);
    default:
      return projects;
  }
}
