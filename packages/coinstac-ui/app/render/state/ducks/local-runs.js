import { applyAsyncLoading } from './loading';
import localDB from '../local-db';

// Actions
const GET_LOCAL_RUNS = 'GET_LOCAL_RUNS';
const SAVE_LOCAL_RUN = 'SAVE_LOCAL_RUN';
const BULK_SAVE_LOCAL_RUNS = 'BULK_SAVE_LOCAL_RUNS';

// Action Creators
export const bulkSaveLocalRuns = applyAsyncLoading(runs =>
  dispatch =>
    localDB.runs.bulkPut(runs)
      .then(() => {
        dispatch(({
          type: BULK_SAVE_LOCAL_RUNS,
          payload: runs,
        }));
      })
);

export const getLocalRuns = applyAsyncLoading(() =>
  dispatch =>
    localDB.runs
      .toArray()
      .then((runs) => {
        dispatch(({
          type: GET_LOCAL_RUNS,
          payload: runs,
        }));
      })
);

export const saveLocalRun = applyAsyncLoading(run =>
  dispatch =>
    localDB.runs.put(run)
      .then(() => {
        dispatch(({
          type: SAVE_LOCAL_RUN,
          payload: run,
        }));
      })
);

const INITIAL_STATE = {
  runs: [],
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case BULK_SAVE_LOCAL_RUNS: {
      const runs = [...state.runs];
      action.payload.forEach((payloadRun) => {
        const index = runs.findIndex(localRun => localRun.id === payloadRun.id);
        if (index === -1) {
          runs.push(payloadRun);
        }
      });

      return { ...state, runs };
    }
    case GET_LOCAL_RUNS:
      return { ...state, runs: action.payload };
    case SAVE_LOCAL_RUN: {
      const runs = [...state.runs];
      const index = runs.findIndex(run => run.id === action.payload.id);

      if (index === -1) {
        runs.push(action.payload);
      } else {
        runs.splice(index, 1, action.payload);
      }

      return { ...state, runs };
    }
    default:
      return state;
  }
}
