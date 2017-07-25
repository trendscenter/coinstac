import app from 'ampersand-app';
import { compact, flatten, sortBy } from 'lodash';
import { applyAsyncLoading } from './loading';

// Actions
export const SET_LOCAL_RESULTS = 'SET_LOCAL_RESULTS';
export const SET_REMOTE_RESULTS = 'SET_REMOTE_RESULTS';

// Action Creators
export const setLocalResults = results => ({ type: SET_LOCAL_RESULTS, payload: results });
export const setRemoteResults = results => ({ type: SET_REMOTE_RESULTS, payload: results });

// Helpers
export const fetchLocalResults = applyAsyncLoading((id) => {
  return (dispatch) => { // eslint-disable-line
    return app.core.dbRegistry.get(`local-consortium-${id}`).all()
    .then(setLocalResults);
  };
});

export const fetchRemoteResults = applyAsyncLoading(id => (dispatch) => {
  const dbRegistry = app.core.dbRegistry;
  const dbs = id ?
    [dbRegistry.get(`remote-consortium-${id}`)] :
    dbRegistry.all.filter(({ name }) => name.includes('remote-consortium-'));

  return Promise.all(dbs.map(db => db.all()))
    .then((responses) => {
      const results = compact(flatten(responses));
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
            computation: getState().computations
              .allComputations
              .find(({ _id }) => _id === res.computationId),
          };
        });
      const results = sortBy(userResults, ['endDate', 'startDate']).reverse();
      dispatch(setRemoteResults(results));
      return results;
    });
};

const INITIAL_STATE = {
  localResults: [],
  remoteResults: [],
};

// Reducer
export default function reducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case SET_LOCAL_RESULTS:
      if (!action.payload) {
        return {
          ...state,
          localResults: INITIAL_STATE.localResults,
        };
      }
      return {
        ...state,
        localResults: [...action.payload],
      };
    case SET_REMOTE_RESULTS:
      if (!action.payload) {
        return {
          ...state,
          remoteResults: INITIAL_STATE.remoteResults,
        };
      }
      return {
        ...state,
        remoteResults: [...action.payload],
      };
    default: return state;
  }
}
