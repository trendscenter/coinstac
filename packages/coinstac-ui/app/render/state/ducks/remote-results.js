import { applyAsyncLoading } from './loading';
import app from 'ampersand-app';
import { compact, flatten, sortBy } from 'lodash';

const SET_REMOTE_RESULTS = 'SET_REMOTE_RESULTS';

export const setRemoteResults = (results) => ({ type: SET_REMOTE_RESULTS, results });

export const fetch = applyAsyncLoading(id => (dispatch) => {
  const dbRegistry = app.core.dbRegistry;
  const dbs = id ?
    [dbRegistry.get(`remote-consortium-${id}`)] :
    dbRegistry.all.filter(({ name }) => name.includes('remote-consortium-'));

  return Promise.all(dbs.map(db => db.all()))
    .then((responses) => {
      const results = sortBy(compact(flatten(responses)), ['endDate', 'startDate']).reverse();
      dispatch(setRemoteResults(results));
      return results;
    });
});

export const fetchRemoteResultsForUser = username => (dispatch, getState) => {
  const dbRegistry = app.core.dbRegistry;
  const dbs = dbRegistry.all.filter(({ name }) => name.includes('remote-consortium-'));

  return Promise.all(dbs.map(db => db.all()))
    .then((responses) => {
      const userResults = compact(flatten(responses))
        .filter(obj => obj.usernames.indexOf(username) > -1)
        .map((res) => {
          return {
            ...res,
            consortium: getState().consortia.find(({ _id }) => _id === res.consortiumId),
            // This doesn't actually seem to be used
            // project: getState().projects.find(({ consortiumId }) =>
            //   consortiumId === res.consortiumId),
            computation: getState().computations.find(({ _id }) => _id === res.computationId),
          };
        });
      const results = sortBy(userResults, ['endDate', 'startDate']).reverse();
      dispatch(setRemoteResults(results));
      return results;
    });
};

export default function reducer(state = null, action = {}) {
  switch (action.type) {
    case 'SET_REMOTE_RESULTS':
      if (!action.results) { return null; }
      return [...action.results];
    default: return state;
  }
}
