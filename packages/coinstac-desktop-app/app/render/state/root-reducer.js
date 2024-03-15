import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

import app from './ducks/app';
import auth from './ducks/auth';
import docker from './ducks/docker';
import loading from './ducks/loading';
import localRunResults from './ducks/localRunResults';
import maps from './ducks/maps';
import notifications from './ducks/notifyAndLog';
import createRunsReducer from './ducks/runs';
import { CLEAR_STATE } from './ducks/statePersist';
import suspendedRuns from './ducks/suspendedRuns';

function rootReducer(persistStorage) {
  const appReducer = combineReducers({
    app,
    auth,
    docker,
    loading,
    notifications,
    runs: createRunsReducer(persistStorage),
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

export default rootReducer;
