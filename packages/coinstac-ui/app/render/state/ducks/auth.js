import axios from 'axios';
import ipcPromise from 'ipc-promise';
import { remote } from 'electron';
import { applyAsyncLoading } from './loading';

const CoinstacClientCore = require('coinstac-client-core');

const apiServer = remote.getGlobal('config').get('apiServer');
const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;

const INITIAL_STATE = {
  user: {
    id: '',
    username: '',
    permissions: {},
    email: '',
    institution: '',
    consortiaStatuses: {},
  },
  appDirectory: localStorage.getItem('appDirectory') || CoinstacClientCore.getDefaultAppDirectory(),
  isApiVersionCompatible: true,
};

// Actions
const SET_USER = 'SET_USER';
const CLEAR_USER = 'CLEAR_USER';
const CLEAR_ERROR = 'CLEAR_ERROR';
const UPDATE_USER_CONSORTIA_STATUSES = 'UPDATE_USER_CONSORTIA_STATUSES';
const UPDATE_USER_PERMS = 'UPDATE_USER_PERMS';
const SET_APP_DIRECTORY = 'SET_APP_DIRECTORY';
const SET_API_VERSION_CHECK = 'SET_API_VERSION_CHECK';

// Action Creators
export const setUser = user => ({ type: SET_USER, payload: user });
export const clearError = () => ({ type: CLEAR_ERROR, payload: null });
export const updateUserPerms = perms => ({ type: UPDATE_USER_PERMS, payload: perms });
export const updateUserConsortiaStatuses = statuses => ({
  type: UPDATE_USER_CONSORTIA_STATUSES,
  payload: statuses,
});
export const clearUser = () => ({ type: CLEAR_USER, payload: null });
export const setAppDirectory = appDirectory => ({ type: SET_APP_DIRECTORY, payload: appDirectory });
export const setApiVersionCheck = isApiVersionCompatible => ({
  type: SET_API_VERSION_CHECK,
  payload: isApiVersionCompatible,
});

// Helpers
const initCoreAndSetToken = (reqUser, data, appDirectory, dispatch) => {
  if (appDirectory) {
    localStorage.setItem('appDirectory', appDirectory);
  }

  return ipcPromise.send('login-init', { userId: reqUser.username, appDirectory })
    .then(() => {
      const user = { ...data.user, label: reqUser.username };

      if (reqUser.saveLogin) {
        localStorage.setItem('id_token', data.id_token);
      } else {
        sessionStorage.setItem('id_token', data.id_token);
      }

      dispatch(setUser({ user }));
    });
};

export const autoLogin = applyAsyncLoading(() => (dispatch, getState) => {
  let token = localStorage.getItem('id_token');
  let saveLogin = true;

  if (!token || token === 'null' || token === 'undefined') {
    token = sessionStorage.getItem('id_token');
    saveLogin = false;
  }

  if (!token || token === 'null' || token === 'undefined') {
    return;
  }

  return axios.post(
    `${API_URL}/authenticateByToken`,
    null,
    { headers: { Authorization: `Bearer ${token}` } }
  )
    // TODO: GET RID OF CORE INIT
    .then(({ data }) => {
      const { auth: { appDirectory } } = getState();
      return initCoreAndSetToken(
        { username: data.user.id, saveLogin, password: 'password' },
        data,
        appDirectory,
        dispatch
      );
    })
    .catch((err) => {
      if (err.response) {
        localStorage.setItem('id_token', null);
        if (err.response.status === 401) {
          dispatch(setUser({ ...INITIAL_STATE, error: 'Please Login Again' }));
        } else {
          dispatch(setUser({ ...INITIAL_STATE, error: 'An unexpected error has occurred' }));
        }
      } else {
        dispatch(setUser({ ...INITIAL_STATE, error: 'Server not responding' }));
      }
    });
});

export const checkApiVersion = applyAsyncLoading(() => dispatch => axios.get(`${API_URL}/version`)
  .then(({ data }) => {
    const versionsMatch = process.env.NODE_ENV !== 'production' || data === remote.app.getVersion();
    dispatch(setApiVersionCheck(versionsMatch));
  })
  .catch(() => {
    dispatch(setUser({ ...INITIAL_STATE, error: 'An unexpected error has occurred' }));
  }));

export const login = applyAsyncLoading(({ username, password, saveLogin }) => (dispatch, getState) => axios.post(`${API_URL}/authenticate`, { username, password })
  .then(({ data }) => {
    const { auth: { appDirectory } } = getState();
    return initCoreAndSetToken({ username, password, saveLogin }, data, appDirectory, dispatch);
  })
  .catch((err) => {
    if (err.response) {
      if (err.response.status === 401) {
        dispatch(setUser({ ...INITIAL_STATE, error: 'Username and/or Password Incorrect' }));
      } else {
        dispatch(setUser({ ...INITIAL_STATE, error: 'An unexpected error has occurred' }));
      }
    } else {
      dispatch(setUser({ ...INITIAL_STATE, error: 'Server not responding' }));
    }
  }));

export const logout = applyAsyncLoading(() => (dispatch) => {
  localStorage.setItem('id_token', null);
  sessionStorage.setItem('id_token', null);
  dispatch(clearUser());
});

export const signUp = applyAsyncLoading(user => (dispatch, getState) => axios.post(`${API_URL}/createAccount`, user)
  .then(({ data }) => {
    const { auth: { appDirectory } } = getState();
    return initCoreAndSetToken(user, data, appDirectory, dispatch);
  })
  .catch((err) => {
    if (err.response && err.response.data && (err.response.data.message === 'Username taken'
          || err.response.data.message === 'Email taken')) {
      dispatch(setUser({ ...INITIAL_STATE, error: err.response.data.message }));
    }
  }));

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_USER:
      return { ...INITIAL_STATE };
    case CLEAR_ERROR:
      return { user: state.user };
    case SET_USER:
      return { ...action.payload };
    case UPDATE_USER_CONSORTIA_STATUSES:
      return { user: { ...state.user, consortiaStatuses: action.payload } };
    case UPDATE_USER_PERMS:
      return { user: { ...state.user, permissions: action.payload } };
    case SET_APP_DIRECTORY:
      return { appDirectory: action.payload };
    case SET_API_VERSION_CHECK:
      return { isApiVersionCompatible: action.payload };
    default:
      return state;
  }
}
