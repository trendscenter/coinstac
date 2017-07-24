import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import auth from './ducks/auth';
import computation from './ducks/computation';
import computations from './ducks/computations';
import consortiaState from './ducks/consortia';
import loading from './ducks/loading';
import project from './ducks/project';
import projects from './ducks/projects';
import remoteResults from './ducks/remote-results';

const rootReducer = combineReducers({
  auth,
  computation,
  computations,
  consortiaState,
  form,
  loading,
  project,
  projects,
  remoteResults,
});

export default rootReducer;
