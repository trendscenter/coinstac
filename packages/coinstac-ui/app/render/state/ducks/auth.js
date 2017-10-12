import { pick } from 'lodash';
import app from 'ampersand-app';
import axios from 'axios';
import { applyAsyncLoading } from './loading';
// import { teardownPrivateBackgroundServices } from './bg-services';

const SET_USER = 'SET_USER';
const setUser = user => ({ type: SET_USER, payload: user });

const CLEAR_USER = 'CLEAR_USER';
export const clearUser = () => ({ type: CLEAR_USER, payload: null });

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

  return app.core.initialize(pick(reqUser, ['password', 'username']))
    .then(() => dispatch(setUser({ user })));
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
      'http://localhost:3100/authenticateByToken',
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
    axios.post('http://localhost:3100/authenticate', { username, password })
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
    axios.post('http://localhost:3100/createAccount', user)
    .then(({ data }) => setTokenAndInitialize(user, data, dispatch))
    .catch(({ response: { data: { message } } }) => {
      if (message === 'Username taken'
          || message === 'Email taken') {
        dispatch(setUser({ ...INITIAL_STATE, error: message }));
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
    case SET_USER:
      return { ...action.payload };
    default:
      return state;
  }
}
