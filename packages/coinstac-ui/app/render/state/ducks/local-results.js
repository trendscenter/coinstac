import { applyAsyncLoading } from './loading';
import app from 'ampersand-app';
import bluebird from 'bluebird';

const SET_LOCAL_RESULTS = 'SET_LOCAL_RESULTS';

export const setLocalResults = (results) => ({ type: SET_LOCAL_RESULTS, results });

export const fetch = applyAsyncLoading(function fetchConsortiumLocalResults(id) {
  return (dispatch) => { // eslint-disable-line
    return app.core.dbRegistry.get(`local-consortium-${id}`).all()
    .then(setLocalResults);
  };
});

export default function reducer(state = null, action = {}) {
  switch (action.type) {
    case 'SET_LOCAL_RESULTS':
      if (!action.results) { return null; }
      return [...action.results];
    default: return state;
  }
}
