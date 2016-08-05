import { combineReducers } from 'redux';
import auth from './ducks/auth';
import computation from './ducks/computation';
import computations from './ducks/computations';
import consortia from './ducks/consortia';
import loading from './ducks/loading';
import project from './ducks/project';
import projects from './ducks/projects';
import remoteResults from './ducks/remote-results';
import { reducer as form } from 'redux-form';

export default function get() {
  return combineReducers({
    auth,
    computation,
    computations,
    consortia,
    form,
    loading,
    project,
    projects,
    remoteResults,
  });
}
