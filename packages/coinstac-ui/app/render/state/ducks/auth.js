import { pick } from 'lodash';
import app from 'ampersand-app';
import axios from 'axios';
import * as util from './util';
import { applyAsyncLoading } from './loading';
import { teardownPrivateBackgroundServices } from './bg-services';

const SET_USER = 'SET_USER';
const setUser = user => ({ type: SET_USER, user });

export const login = applyAsyncLoading((reqUser) => {
  return (dispatch) => {
    return axios.post('http://localhost:3100/authenticate', reqUser)
      .then(({ data: { id_token } }) => {
        const user = { ...reqUser, email: `${reqUser.username}@coinstac.org`, label: reqUser.username };
        localStorage.setItem('id_token', id_token);
        dispatch(setUser(user));
        return user;
        // return app.core.initialize(pick(reqUser, ['password', 'username']))
      });
      /*
      .then((user) => {
        dispatch(setUser(user));
        return user;
      })
      */
      // .catch(util.notifyAndThrow);
  };
});

export const logout = applyAsyncLoading(() => {
  return (dispatch) => {
    return dispatch(teardownPrivateBackgroundServices()) // does app.core.logout*
    .then(() => dispatch(setUser({ email: '' })));
  };
});

export const signUp = applyAsyncLoading(user => dispatch => app.core
  .initialize(user)
  .then((user) => {
    dispatch(setUser(user));
    return user;
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
    case SET_USER:
      if (!action.user) { return null; }
      return Object.assign({}, state, { user: action.user || {} });
    default:
      return state;
  }
}
