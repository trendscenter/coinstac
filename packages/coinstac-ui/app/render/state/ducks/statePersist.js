/* eslint-disable import/prefer-default-export */
import { dirname, join } from 'path';
import { deepParseJson } from 'deep-parse-json';

import { API_TOKEN_KEY, setUser } from './auth';

let electronStore;
let persistConfig;
let storePersistor;

export const CLEAR_STATE = 'CLEAR_STATE';
export const REHYDRATE = 'REHYDRATE';

export const clearState = state => ({ type: CLEAR_STATE, payload: state });
export const rehydrate = state => ({ type: REHYDRATE, payload: state });

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

    delete parsedState._persist;

    dispatch(rehydrate(parsedState));
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
  init,
  loadUserState,
  clearUserState,
};
