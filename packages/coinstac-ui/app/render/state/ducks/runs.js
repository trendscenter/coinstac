import { uniqBy } from 'lodash';
import { applyAsyncLoading } from './loading';

// Actions
const CLEAR_RUNS = 'CLEAR_RUNS';
const SAVE_LOCAL_RUN = 'SAVE_LOCAL_RUN';
const UPDATE_LOCAL_RUN = 'UPDATE_LOCAL_RUN';

// Action Creators
export const clearRuns = applyAsyncLoading(() => (dispatch) => {
  dispatch(({
    type: CLEAR_RUNS,
    payload: null,
  }));
});

export const saveLocalRun = applyAsyncLoading(run => (dispatch) => {
  dispatch(({
    type: SAVE_LOCAL_RUN,
    payload: run,
  }));
});

export const updateLocalRun = applyAsyncLoading(
  (runId, object) => (dispatch) => {
    dispatch(({
      type: UPDATE_LOCAL_RUN,
      payload: { runId, object },
    }));
  });

const INITIAL_STATE = {
  localRuns: [],
  remoteRuns: [],
  runs: [],
};

function runSort(a, b) {
  return b.startDate - a.startDate;
}

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_RUNS:
      return INITIAL_STATE;
    case SAVE_LOCAL_RUN: {
      const localRuns = [...state.localRuns];
      const index = localRuns.findIndex(run => run.id === action.payload.id);

      if (index === -1) {
        localRuns.push(action.payload);
      } else {
        localRuns.splice(index, 1, action.payload);
      }

      return { ...state, localRuns, runs: uniqBy([...localRuns, ...state.remoteRuns].sort(runSort), 'id') };
    }
    case UPDATE_LOCAL_RUN: {
      const localRuns = [...state.localRuns];
      const index = localRuns.findIndex(run => run.id === action.payload.runId);
      localRuns[index] = { ...localRuns[index], ...action.payload.object };

      return { ...state, localRuns, runs: uniqBy([...localRuns, ...state.remoteRuns].sort(runSort), 'id') };
    }
    default:
      return state;
  }
}
