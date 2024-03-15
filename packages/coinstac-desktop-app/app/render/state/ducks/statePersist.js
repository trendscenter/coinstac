/* eslint-disable import/prefer-default-export */
import { deepParseJson } from 'deep-parse-json';
import { dirname, join } from 'path';
import { createMigrate, REHYDRATE } from 'redux-persist';

import localDBMigrations from '../migrations';
import { API_TOKEN_KEY } from './constants';

let electronStore;
let persistConfig;
let storePersistor;

// Increment this version by one everytime the persisted store must undergo a migration
export const CURRENT_PERSISTED_STORE_VERSION = 2;

export const SET_USER = 'SET_USER';

export const CLEAR_STATE = 'CLEAR_STATE';

export const clearState = state => ({ type: CLEAR_STATE, payload: state });

export const setUser = user => ({ type: SET_USER, payload: user });

function init(store, config, persistor) {
  electronStore = store;
  persistConfig = config;
  storePersistor = persistor;
}

const loadUserState = (user, authTokenData) => async (dispatch) => {
  const electronStoreFolder = dirname(electronStore.path);
  electronStore.path = join(electronStoreFolder, `local-db-${user.id}.json`);

  const data = await persistConfig.storage.getItem('persist:root');
  storePersistor.persist();

  // Rehydrate is done only once by redux-persist, so we do it manually
  // for hydrating state on consecutive logins
  if (data) {
    const parsedState = deepParseJson(data);

    const migrate = createMigrate(localDBMigrations, { debug: true });

    const migratedState = await migrate(parsedState, CURRENT_PERSISTED_STORE_VERSION);

    dispatch({
      type: REHYDRATE,
      key: 'root',
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
