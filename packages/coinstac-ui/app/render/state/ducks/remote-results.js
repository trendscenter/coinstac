import { applyAsyncLoading } from './loading';
import app from 'ampersand-app';

const SET_REMOTE_RESULTS = 'SET_REMOTE_RESULTS';

export const setRemoteResults = (results) => ({ type: SET_REMOTE_RESULTS, results });

export const fetch = applyAsyncLoading(id => {
  return (dispatch) => { // eslint-disable-line
    const db = app.core.dbRegistry.get(`remote-consortium-${id}`);
    return db.all()
    .then((rslts) => {
      dispatch(setRemoteResults(rslts));
      return rslts;
    });
  };
});

export default function reducer(state = null, action = {}) {
  switch (action.type) {
    case 'SET_REMOTE_RESULTS':
      if (!action.results) { return null; }
      return [...action.results];
    default: return state;
  }
}
