import { uniqBy } from 'lodash';

// Actions
const CLEAR_RUNS = 'CLEAR_RUNS';
const SAVE_LOCAL_RUN = 'SAVE_LOCAL_RUN';
const SAVE_REMOTE_RUNS_LOCALLY = 'SAVE_REMOTE_RUNS_LOCALLY';
const UPDATE_LOCAL_RUN = 'UPDATE_LOCAL_RUN';

// Action Creators
export const saveRemoteRunsLocally = runs => ({
  type: SAVE_REMOTE_RUNS_LOCALLY,
  payload: runs,
});

export const clearRuns = () => ({
  type: CLEAR_RUNS,
  payload: null,
});

export const getLocalRun = runId => (dispatch, getState) => {
  const { runs: { runs } } = getState();
  const localRuns = runs || [];

  return localRuns.find(r => r.id === runId);
};

export const saveLocalRun = run => ({
  type: SAVE_LOCAL_RUN,
  payload: run,
});

export const updateLocalRun = (runId, object) => ({
  type: UPDATE_LOCAL_RUN,
  payload: { runId, object },
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
    case SAVE_REMOTE_RUNS_LOCALLY: {
      const remoteRuns = [...state.remoteRuns];
      action.payload.forEach((payloadRun) => {
        const index = remoteRuns.findIndex(localRun => localRun.id === payloadRun.id);
        if (index === -1) {
          remoteRuns.push(payloadRun);
        }
      });

      return { ...state, remoteRuns, runs: uniqBy([...state.localRuns, ...remoteRuns].sort(runSort), 'id') };
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
