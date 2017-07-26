import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import client from './apollo-client';
import auth from './ducks/auth';
import computations from './ducks/computations';
import consortia from './ducks/consortia';
import consortiaPage from './ducks/consortia-page';
import loading from './ducks/loading';
import project from './ducks/project';
import projects from './ducks/projects';
import remoteResults from './ducks/remote-results';

const rootReducer = combineReducers({
  apollo: client.reducer(),
  auth,
  computations,
  consortia,
  consortiaPage,
  form,
  loading,
  project,
  projects,
  remoteResults,
});

export default rootReducer;
