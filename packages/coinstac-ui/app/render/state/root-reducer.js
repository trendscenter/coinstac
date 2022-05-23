import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import app from './ducks/app';
import auth from './ducks/auth';
import docker from './ducks/docker';
import loading from './ducks/loading';
import localRunResults from './ducks/localRunResults';
import maps from './ducks/maps';
import createRunsReducer from './ducks/runs';
import notifications from './ducks/notifyAndLog';
import suspendedRuns from './ducks/suspendedRuns';
import { CLEAR_STATE } from './ducks/statePersist';

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
      state = {
        ...state,
        ...action.payload,
      };
    }

    return appReducer(state, action);
  };
}

export default rootReducer;
