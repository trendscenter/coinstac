import { combineReducers } from 'redux';
import { reducer as notifications } from 'react-notification-system-redux';
import auth from './ducks/auth';
import collections from './ducks/collections';
import docker from './ducks/docker';
import loading from './ducks/loading';
import runs from './ducks/runs';

const rootReducer = client => combineReducers({
  apollo: client.reducer(),
  auth,
  collections,
  docker,
  loading,
  notifications,
  runs,
});

export default rootReducer;
