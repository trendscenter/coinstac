import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import auth from './ducks/auth';
import computations from './ducks/computations';
import consortia from './ducks/consortia';
import consortiaPage from './ducks/consortia-page';
import loading from './ducks/loading';
import project from './ducks/project';
import projects from './ducks/projects';
import results from './ducks/results';

const rootReducer = combineReducers({
  auth,
  computations,
  consortia,
  consortiaPage,
  form,
  loading,
  project,
  projects,
  results,
});

export default rootReducer;
