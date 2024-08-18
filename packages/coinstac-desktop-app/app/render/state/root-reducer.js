import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';

import app from './ducks/app';
import auth from './ducks/auth';
import docker from './ducks/docker';
import loading from './ducks/loading';
import localRunResults from './ducks/localRunResults';
import maps from './ducks/maps';
import notifications from './ducks/notifyAndLog';
import runs from './ducks/runs';
import { CLEAR_STATE, CURRENT_PERSISTED_STORE_VERSION } from './ducks/statePersist';
import suspendedRuns from './ducks/suspendedRuns';
import { storage } from './storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['maps', 'localRunResults', 'suspendedRuns'],
  version: CURRENT_PERSISTED_STORE_VERSION,
};

function rootReducer() {
  const appReducer = combineReducers({
    app,
    auth,
    docker,
    loading,
    notifications,
    runs,
    maps,
    localRunResults,
    suspendedRuns,
    routing: routerReducer,
  });

  return (state, action) => {
    if (action.type === CLEAR_STATE) {
      return appReducer({
        ...state,
        ...action.payload,
      }, action);
    }

    return appReducer(state, action);
  };
}

export default persistReducer(persistConfig, rootReducer());
