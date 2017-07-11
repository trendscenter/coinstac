import { combineReducers } from 'redux';
import auth from './ducks/auth';
import computationsState from './ducks/computations';
import consortia from './ducks/consortia';
import consortiaPage from './ducks/consortia-page';
import loading from './ducks/loading';
import project from './ducks/project';
import projects from './ducks/projects';
import remoteResults from './ducks/remote-results';
import { reducer as form } from 'redux-form';

const rootReducer = combineReducers({
  auth,
  computationsState,
  consortia,
  consortiaPage,
  form,
  loading,
  project,
  projects,
  remoteResults,
});

export default rootReducer;
