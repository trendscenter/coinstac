import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import app from './ducks/app';
import auth from './ducks/auth';
import docker from './ducks/docker';
import loading from './ducks/loading';
import maps from './ducks/maps';
import runs from './ducks/runs';
import notifications from './ducks/notifyAndLog';

const rootReducer = client => combineReducers({
  apollo: client.reducer(),
  app,
  auth,
  docker,
  loading,
  notifications,
  runs,
  maps,
  routing: routerReducer,
});

export default rootReducer;
