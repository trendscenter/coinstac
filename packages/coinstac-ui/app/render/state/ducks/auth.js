import { pick } from 'lodash';
import app from 'ampersand-app';
import axios from 'axios';
import * as util from './util';
import { applyAsyncLoading } from './loading';
import { teardownPrivateBackgroundServices } from './bg-services';

const SET_USER = 'SET_USER';
const setUser = user => ({ type: SET_USER, payload: user });

const CLEAR_USER = 'CLEAR_USER';
export const clearUser = () => ({ type: CLEAR_USER, payload: null });

const setTokenAndInitialize = (reqUser, data, dispatch) => {
  const user = { ...data.user, label: reqUser.username };
  localStorage.setItem('id_token', data.id_token);
  dispatch(setUser(user));

  return app.core.initialize(pick(reqUser, ['password', 'username']));
};

export const login = applyAsyncLoading(reqUser =>
  dispatch =>
    axios.post('http://localhost:3100/authenticate', reqUser)
    .then(({ data }) => setTokenAndInitialize(reqUser, data, dispatch))
    .catch((err) => {
      if (err.response.status === 401) {
        dispatch(setUser({ error: 'Username and/or Password Incorrect' }));
      }
    })
);

export const logout = applyAsyncLoading(() => {
  return (dispatch) => {
    return dispatch(teardownPrivateBackgroundServices()) // does app.core.logout*
    .then(() => dispatch(setUser({ email: '' })));
  };
});

export const signUp = applyAsyncLoading(user =>
  dispatch =>
    axios.post('http://localhost:3100/createAccount', user)
    .then(({ data }) => setTokenAndInitialize(user, data, dispatch))
    .catch(({ response: { data: { message } } }) => {
      if (message === 'Username taken'
          || message === 'Email taken') {
        dispatch(setUser({ error: message }));
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
    return dispatch(login(user));
  };
};

export default function reducer(state = { user: null }, action) {
  switch (action.type) {
    case CLEAR_USER:
      return { ...state, user: null };
    case SET_USER:
      return { ...state, user: action.payload };
    default:
      return state;
  }
}
