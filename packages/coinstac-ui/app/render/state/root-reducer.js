import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import client from './apollo-client';
import auth from './ducks/auth';
import computations from './ducks/computations';
import consortia from './ducks/consortia';
import featureTest from './ducks/feature-test';
import loading from './ducks/loading';
import projects from './ducks/projects';
import results from './ducks/results';

const rootReducer = combineReducers({
  apollo: client.reducer(),
  auth,
  computations,
  consortia,
  featureTest,
  form,
  loading,
  projects,
  results,
});

export default rootReducer;
