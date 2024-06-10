/* eslint-disable import/prefer-default-export */
import { deepParseJson } from 'deep-parse-json';
import { dirname, join } from 'path';
import { createMigrate, REHYDRATE } from 'redux-persist';

import localDBMigrations from '../migrations';
import { electronStore, storage } from '../storage';
import { API_TOKEN_KEY } from './constants';

let storePersistor;

// Increment this version by one everytime the persisted store must undergo a migration
export const CURRENT_PERSISTED_STORE_VERSION = 2;

export const SET_USER = 'SET_USER';

export const CLEAR_STATE = 'CLEAR_STATE';

export const clearState = state => ({ type: CLEAR_STATE, payload: state });

export const setUser = user => ({ type: SET_USER, payload: user });

function init(persistor) {
  storePersistor = persistor;
}

const loadUserState = (user, authTokenData) => async (dispatch) => {
  const electronStoreFolder = dirname(electronStore.path);
  electronStore.path = join(electronStoreFolder, `local-db-${user.id}.json`);

  const rootData = await storage.getItem('persist:root');
  storePersistor.persist();

  // Rehydrate is done only once by redux-persist, so we do it manually
  // for hydrating state on consecutive logins
  if (rootData) {
    const parsedState = deepParseJson(rootData);

    dispatch({
      type: REHYDRATE,
      key: 'root',
      payload: parsedState,
    });
  }

  const runsData = await storage.getItem('persist:runs');

  if (runsData) {
    const parsedState = deepParseJson(runsData);
    const migrate = createMigrate(localDBMigrations, { debug: true });
    const migratedState = await migrate(parsedState, CURRENT_PERSISTED_STORE_VERSION);

    dispatch({
      type: REHYDRATE,
      key: 'runs',
      payload: migratedState,
    });
  }

  localStorage.setItem(API_TOKEN_KEY, JSON.stringify(authTokenData));

  dispatch(setUser(user));
};

const clearUserState = () => (dispatch) => {
  storePersistor.pause();

  // clear persisted state
  dispatch(clearState({
    maps: null,
    localRunResults: null,
  }));
};

export {
  clearUserState,
  init,
  loadUserState,
};
