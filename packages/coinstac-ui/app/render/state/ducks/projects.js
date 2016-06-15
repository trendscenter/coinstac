import { applyAsyncLoading } from './loading.js';
import app from 'ampersand-app';

export const getDb = () => app.core.dbRegistry.get('projects');

export const ADD_PROJECT = 'ADD_PROJECT';
export const _addProject = (project) => ({ type: ADD_PROJECT, project });

export const SET_PROJECTS = 'SET_PROJECTS';
export const setProjects = (projects) => ({ type: SET_PROJECTS, projects });

export const REMOVE_PROJECT = 'REMOVE_PROJECT';
export const removeProject = (project) => ({ type: REMOVE_PROJECT, project });

export const addProject = applyAsyncLoading(function addProject(project, cb) {
  return (dispatch) => {
    return app.core.project.add(project)
    .then((proj) => {
      app.notify('success', `Project '${project.name}' created`);
      dispatch(_addProject(project));
      return proj;
    })
    .catch((err) => {
      app.notify('error', err.message);
      throw err;
    });
  };
});

export const remove = applyAsyncLoading(function remove(project) {
  return (dispatch) => {
    return app.core.project.delete(project)
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
    getDb().all((err, projects) => {
      if (err && err.length) {
        app.notify('error', 'Failed to initialize COINSTAC-UI');
      }
      if (projects) { dispatch(setProjects(projects)); }
      cb(err, projects);
    });
  };
});

export default function reducer(state = null, action) {
  let projects;
  switch (action.type) {
    case ADD_PROJECT:
      projects = (state || []).push(action.project);
      return [...projects];
    case SET_PROJECTS:
      if (!action.projects) return null;
      return [...action.projects];
    case REMOVE_PROJECT:
      projects = state;
      projects = projects.filter(proj => proj.name !== action.project.name);
      return [...projects];
    default:
      return state;
  }
}
