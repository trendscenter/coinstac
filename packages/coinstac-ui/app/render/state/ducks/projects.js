import app from 'ampersand-app';
import { omit } from 'lodash';
import { applyAsyncLoading } from './loading';
import { joinSlaveComputation } from './bg-services';

// Actions
export const ADD_FILES_TO_PROJECT = 'ADD_FILES_TO_PROJECT';
export const ADD_PROJECT = 'ADD_PROJECT';
export const REMOVE_FILES_FROM_PROJECT = 'REMOVE_FILES_FROM_PROJECT';
export const SET_PROJECT = 'SET_PROJECT';
export const SET_PROJECTS = 'SET_PROJECTS';
export const REMOVE_PROJECT = 'REMOVE_PROJECT';
export const UPDATE_PROJECT_STATUS = 'UPDATE_PROJECT_STATUS';

// Action Creators
export const _addProject = project => ({ type: ADD_PROJECT, payload: project });
export const setProjects = projects => ({ type: SET_PROJECTS, payload: projects });
export const removeProject = id => ({
  payload: id,
  type: REMOVE_PROJECT,
});

export function setProject(project) {
  return { type: SET_PROJECT, payload: project };
}

/**
 * Add files to project.
 *
 * @param {string} json Collection of file models
 * @returns {Object}
 */
export function addFilesToProject(json = '[]') {
  const files = JSON.parse(json);

  return {
    payload: files,
    type: ADD_FILES_TO_PROJECT,
  };
}

/**
 * Remove files from project.
 *
 * @param {File[]} files Collection of file models
 * @returns {Object}
 */
export function removeFilesFromProject(files) {
  return {
    payload: files,
    type: REMOVE_FILES_FROM_PROJECT,
  };
}

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
    payload: { id, status },
    type: UPDATE_PROJECT_STATUS,
  };
}

// Helpers
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

export const addProject = applyAsyncLoading((project) => {
  return (dispatch) => {
    /**
     * @todo: The `Project` model is decorated with `allowComputationRun` and
     * `status` properties for the UI. Determine a consistent way to add/strip
     * these props when dealing with the storage layer.
     */
    return app.core.projects.save(
      omit(project, ['allowComputationRun', 'status'])
    )
      .then((doc) => {
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
        app.notify({
          level: 'success',
          message: `Project '${project.name}' created`,
        });
        dispatch(_addProject(proj));
        return proj;
      });
  };
});

export const fetch = applyAsyncLoading((cb) => {
  return (dispatch) => {
    return app.core.projects.all()
      .then(projects => Promise.all(projects.map(mapProject)))
      .then((projects) => {
        dispatch(setProjects(projects));
        cb(null, projects);
      })
      .catch((error) => {
        cb(error);
      });
  };
});

/**
 * fetches and sets a project
 * @param {string} projectId
 * @param {function} cb
 * @returns {undefined}
 */
export const fetchProject = applyAsyncLoading((projectId) => {
  return (dispatch) => {
    return app.core.dbRegistry.get('projects').get(projectId)
    .then((proj) => {
      dispatch(setProject(proj));
      return proj;
    })
    .catch((err) => {
      app.notify({
        level: 'error',
        message: `Unable to fetch project: ${err.message}`,
      });
      throw err;
    });
  };
});

/**
 * saves a project (new or existing)
 * @param {object|Project}
 * @returns {Promise}
 */
export const saveProject = applyAsyncLoading((project) => {
  return () => {
    return app.core.projects.save(project)
    .catch((err) => {
      app.notify({
        level: 'error',
        message: err.message,
      });
      throw err;
    });
  };
});

/**
 * Remove a project.
 *
 * @param {Project} project
 * @returns {Promise}
 */
export const remove = applyAsyncLoading(
  project => dispatch => app.core.projects.delete(project).then(
    (rslt) => {
      app.notify({
        level: 'success',
        message: `Project '${project.name}' removed`,
      });
      dispatch(removeProject(project._id));
      return rslt;
    },
    (err) => {
      app.notify({
        level: 'error',
        message: err.message,
      });
      throw err;
    }
  )
);

const INITIAL_STATE = {
  activeProject: null,
  allProjects: [],
};

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
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ADD_FILES_TO_PROJECT:
      return {
        ...state,
        activeProject: Object.assign({}, action.payload, {
          files: [...state.activeProject.files, ...action.payload],
        }),
      };
    case ADD_PROJECT:
      return {
        ...state,
        allProjects: [...state.allProjects, ...action.payload],
      };
    case SET_PROJECT:
      if (!action.project) {
        return {
          ...state,
          activeProject: INITIAL_STATE.project,
        }; // clear project state
      }
      return {
        ...state,
        activeProject: Object.assign({}, state.activeProject, action.payload),
      };
    case SET_PROJECTS:
      if (!action.payload) {
        return state;
      }
      return {
        ...state,
        allProjects: [...action.payload],
      };
    case REMOVE_FILES_FROM_PROJECT:
      return {
        ...state,
        activeProject: Object.assign({}, state.project, {
          files: state.activeProject.files.filter((file) => {
            return action.payload.every(f => f.filename !== file.filename);
          }),
        }),
      };
    case REMOVE_PROJECT:
      return {
        ...state,
        allProjects: state.allProjects.filter(({ _id }) => _id !== action.payload),
      };
    case UPDATE_PROJECT_STATUS:
      return {
        ...state,
        allProjects: state.allProjects.map((p) => {
          return p._id === action.payload.id ?
            Object.assign({}, p, { status: action.payload.status }) :
            p;
        }),
      };
    default:
      return state;
  }
}
