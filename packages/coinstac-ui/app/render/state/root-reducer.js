import { combineReducers } from 'redux';
import auth from './ducks/auth';
import computation from './ducks/computation';
import computations from './ducks/computations';
import consortia from './ducks/consortia';
import consortiaPage from './ducks/consortia-page';
import loading from './ducks/loading';
import project from './ducks/project';
import projects from './ducks/projects';
import resultsState from './ducks/results';
import { reducer as form } from 'redux-form';

const rootReducer = combineReducers({
  auth,
  computation,
  computations,
  consortia,
  consortiaPage,
  form,
  loading,
  project,
  projects,
  resultsState,
});

export default rootReducer;
