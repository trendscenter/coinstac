import { combineReducers } from 'redux';
import { reducer as notifications } from 'react-notification-system-redux';
import { routerReducer } from 'react-router-redux';
import app from './ducks/app';
import auth from './ducks/auth';
import collections from './ducks/collections';
import docker from './ducks/docker';
import loading from './ducks/loading';
import runs from './ducks/runs';

const rootReducer = client => combineReducers({
  apollo: client.reducer(),
  app,
  auth,
  collections,
  docker,
  loading,
  notifications,
  runs,
  routing: routerReducer,
});

export default rootReducer;
