import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import { reducer as notifications } from 'react-notification-system-redux';
import auth from './ducks/auth';
import collections from './ducks/collections';
import docker from './ducks/docker';
import loading from './ducks/loading';

const rootReducer = client => combineReducers({
  apollo: client.reducer(),
  auth,
  collections,
  docker,
  form,
  loading,
  notifications,
});

export default rootReducer;
