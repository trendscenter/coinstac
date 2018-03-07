import axios from 'axios';
import ipcPromise from 'ipc-promise';
import { remote } from 'electron';
import { applyAsyncLoading } from './loading';

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
};

// Actions
const SET_USER = 'SET_USER';
const CLEAR_USER = 'CLEAR_USER';
const CLEAR_ERROR = 'CLEAR_ERROR';
const UPDATE_USER_CONSORTIA_STATUSES = 'UPDATE_USER_CONSORTIA_STATUSES';
const UPDATE_USER_PERMS = 'UPDATE_USER_PERMS';

// Action Creators
const setUser = user => ({ type: SET_USER, payload: user });
export const clearError = () => ({ type: CLEAR_ERROR, payload: null });
export const updateUserPerms = perms => ({ type: UPDATE_USER_PERMS, payload: perms });
export const updateUserConsortiaStatuses = statuses =>
  ({ type: UPDATE_USER_CONSORTIA_STATUSES, payload: statuses });
export const clearUser = () => ({ type: CLEAR_USER, payload: null });

// Helpers
const initCoreAndSetToken = (reqUser, data, dispatch) => {
  return ipcPromise.send('login-init', reqUser.username)
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

export const autoLogin = applyAsyncLoading(() =>
  (dispatch) => {
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
    .then(({ data }) => initCoreAndSetToken(
      { username: data.user.id, saveLogin, password: 'password' },
      data,
      dispatch
    ))
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        localStorage.setItem('id_token', null);
        dispatch(setUser({ ...INITIAL_STATE, error: 'Please Login Again' }));
      } else if (err.request && err.request.status === 0) {
        dispatch(setUser({ ...INITIAL_STATE, error: 'Server not responding' }));
      }
    });
  }
);

export const login = applyAsyncLoading(({ username, password, saveLogin }) =>
  dispatch =>
    axios.post(`${API_URL}/authenticate`, { username, password })
    .then(({ data }) => initCoreAndSetToken({ username, password, saveLogin }, data, dispatch))
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        dispatch(setUser({ ...INITIAL_STATE, error: 'Username and/or Password Incorrect' }));
      } else if (err.request && err.request.status === 0) {
        dispatch(setUser({ ...INITIAL_STATE, error: 'Server not responding' }));
      }
    })
);

export const logout = applyAsyncLoading(() =>
  (dispatch) => {
    localStorage.setItem('id_token', null);
    sessionStorage.setItem('id_token', null);
    dispatch(clearUser());
  }
);

export const signUp = applyAsyncLoading(user =>
  dispatch =>
    axios.post(`${API_URL}/createAccount`, user)
    .then(({ data }) => initCoreAndSetToken(user, data, dispatch))
    .catch((err) => {
      if (err.response && err.response.data && (err.response.data.message === 'Username taken'
          || err.response.data.message === 'Email taken')) {
        dispatch(setUser({ ...INITIAL_STATE, error: err.response.data.message }));
      }
    })
);

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
    default:
      return state;
  }
}
