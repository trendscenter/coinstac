import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import { reducer as notifications } from 'react-notification-system-redux';
import client from './apollo-client';
import auth from './ducks/auth';
import collections from './ducks/collections';
import featureTest from './ducks/feature-test';
import loading from './ducks/loading';

const rootReducer = combineReducers({
  apollo: client.reducer(),
  auth,
  collections,
  featureTest,
  form,
  loading,
  notifications,
});

export default rootReducer;
