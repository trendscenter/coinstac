import { pick } from 'lodash';
import app from 'ampersand-app';
import axios from 'axios';
import { applyAsyncLoading } from './loading';
import { apiServer } from '../../../../config/local';

const API_URL = `${apiServer.protocol}//${apiServer.hostname}:${apiServer.port}`;
const CLEAR_ERROR = 'CLEAR_ERROR';
const CLEAR_USER = 'CLEAR_USER';
const SET_USER = 'SET_USER';
const UPDATE_USER_PERMS = 'UPDATE_USER_PERMS';

const setUser = user => ({ type: SET_USER, payload: user });
export const clearUser = () => ({ type: CLEAR_USER, payload: null });
export const updateUserPerms = perms => ({ type: UPDATE_USER_PERMS, payload: perms });
export const clearError = () => ({ type: CLEAR_ERROR, payload: null });

const INITIAL_STATE = {
  user: {
    id: '',
    username: '',
    permissions: {},
    email: '',
    institution: '',
  },
};


const setTokenAndInitialize = (reqUser, data, dispatch) => {
  const user = { ...data.user, label: reqUser.username };

  if (reqUser.saveLogin) {
    localStorage.setItem('id_token', data.id_token);
  } else {
    sessionStorage.setItem('id_token', data.id_token);
  }

  dispatch(setUser({ user }));
  return app.core.initialize(pick(reqUser, ['password', 'username']));
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
    .then(({ data }) => setTokenAndInitialize(
      { username: data.user.id, saveLogin, password: 'GET_RID_OF_CORE_INIT_AT_LOGIN' },
      data,
      dispatch
    ))
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        localStorage.setItem('id_token', null);
        dispatch(setUser({ ...INITIAL_STATE, error: 'Please Login Again' }));
      }
    });
  }
);

export const login = applyAsyncLoading(({ username, password, saveLogin }) =>
  dispatch =>
    axios.post(`${API_URL}/authenticate`, { username, password })
    .then(({ data }) => setTokenAndInitialize({ username, password, saveLogin }, data, dispatch))
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        dispatch(setUser({ ...INITIAL_STATE, error: 'Username and/or Password Incorrect' }));
      }
    })
);

export const logout = applyAsyncLoading(() =>
  (dispatch) => {
    localStorage.setItem('id_token', null);
    sessionStorage.setItem('id_token', null);
    dispatch(clearUser());
  }
  /*
  return (dispatch) => {
    return dispatch(teardownPrivateBackgroundServices()) // does app.core.logout*
    .then(() => dispatch(setUser({ email: '' })));
  };
  */
);

export const signUp = applyAsyncLoading(user =>
  dispatch =>
    axios.post(`${API_URL}/createAccount`, user)
    .then(({ data }) => setTokenAndInitialize(user, data, dispatch))
    .catch((err) => {
      if (err.response && err.response.data && (err.response.data.message === 'Username taken'
          || err.response.data.message === 'Email taken')) {
        dispatch(setUser({ ...INITIAL_STATE, error: err.response.data.message }));
      }
    })
);

export const hotRoute = () => {
  return (dispatch) => { // eslint-disable-line
    const testUser = app.config.get('testUser');
    const user = {
      name: 'test',
      username: testUser.username,
      password: testUser.password,
      email: 'test@test.com',
      label: 'test test',
    };
    dispatch(login(user));
  };
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_USER:
      return { ...INITIAL_STATE };
    case CLEAR_ERROR:
      return { user: state.user };
    case SET_USER:
      return { ...action.payload };
    case UPDATE_USER_PERMS:
      return { user: { ...state.user, permissions: action.payload } };
    default:
      return state;
  }
}
