import { combineReducers } from 'redux';
import { reducer as notifications } from 'react-notification-system-redux';
import { routerReducer } from 'react-router-redux';
import app from './ducks/app';
import auth from './ducks/auth';
import docker from './ducks/docker';
import loading from './ducks/loading';
import maps from './ducks/maps';
import runs from './ducks/runs';

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
