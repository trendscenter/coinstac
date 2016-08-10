import { applyAsyncLoading } from './loading.js';
import app from 'ampersand-app';
import omit from 'lodash/omit';
import { joinSlaveComputation } from './bg-services';

export const ADD_PROJECT = 'ADD_PROJECT';
export const _addProject = (project) => ({ type: ADD_PROJECT, project });

export const SET_PROJECTS = 'SET_PROJECTS';
export const setProjects = (projects) => ({ type: SET_PROJECTS, projects });

export const REMOVE_PROJECT = 'REMOVE_PROJECT';
export const removeProject = (project) => ({ type: REMOVE_PROJECT, project });

export const UPDATE_PROJECT_STATUS = 'UPDATE_PROJECT_STATUS';

/**
 * @param {Object} options
 * @param {string} options.id Project's ID
 * @param {string} options.status Status
 * @returns {Object}
 * @property {string} id
 * @property {string} status
 * @property {string} type
 */
export function updateProjectStatus({ id, status }) {
  return {
    id,
    status,
    type: UPDATE_PROJECT_STATUS,
  };
}

/**
 * Map project model.
 *
 * This decorates the `Project` model with computated properties:
 *
 * - `allowComputationRun`: Determine whether computations can be run.
 *   Determined via async request.
 * - `status`: project's "state"
 *
 * @todo This is an _awful hack_ as it requires network requests to
 * determine whether a computation can run. Derive this information from
 * already stored state or add a computed property to the `Project`
 * model.
 *
 * @param {Object} project Project-like POJO.
 * @returns {Promise} Resolves to project
 */
export function mapProject(project) {
  function getProject(allowComputationRun = false) {
    return Object.assign(
      { status: 'waiting' },
      project,
      { allowComputationRun }
    );
  }

  if (project.consortiumId) {
    return app.core.computations
      .canStartComputation(project.consortiumId)
      .then(() => getProject(true))
      .catch(() => getProject());
  }

  return Promise.resolve(getProject());
}

export const addProject = applyAsyncLoading(project => {
  return (dispatch) => {
    /**
     * @todo: The `Project` model is decorated with `allowComputationRun` and
     * `status` properties for the UI. Determine a consistent way to add/strip
     * these props when dealing with the storage layer.
     */
    return app.core.projects.save(
      omit(project, ['allowComputationRun', 'status'])
    )
      .then(doc => {
        /**
         * New projects don't have an `_id`. Maybe join the computation run in
         * the 'background':
         *
         * @todo This relies on `joinSlaveComputation` so that UI notifications
         * fire. Move this functionality to coinstac-client-core.
         */
        if (!('_id' in project)) {
          app.core.consortia
            .get(project.consortiumId)
            .then(c => joinSlaveComputation(c));
        }

        return mapProject(doc);
      })
      .then((proj) => {
        app.notify('success', `Project '${project.name}' created`);
        dispatch(_addProject(proj));
        return proj;
      });
  };
});

export const remove = applyAsyncLoading(project => {
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

export const fetch = applyAsyncLoading(cb => {
  return (dispatch) => {
    return app.core.projects.all()
      .then(projects => Promise.all(projects.map(mapProject)))
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
    case UPDATE_PROJECT_STATUS:
      return projects.map(p => {
        return p._id === action.id ?
          Object.assign({}, p, { status: action.status }) :
          p;
      });
    default:
      return projects;
  }
}
