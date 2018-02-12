import { applyAsyncLoading } from './loading';
import localDB from '../local-db';

// Actions
const CLEAR_RUNS = 'CLEAR_RUNS';
const GET_DB_RUNS = 'GET_DB_RUNS';
const SAVE_LOCAL_RUN = 'SAVE_LOCAL_RUN';
const SAVE_REMOTE_RUNS_LOCALLY = 'SAVE_REMOTE_RUNS_LOCALLY';

// Action Creators
export const saveRemoteRunsLocally = applyAsyncLoading(runs =>
  dispatch =>
    localDB.runs.bulkPut(runs)
      .then(() => {
        dispatch(({
          type: SAVE_REMOTE_RUNS_LOCALLY,
          payload: runs,
        }));
      })
);

export const clearRuns = applyAsyncLoading(() =>
  dispatch =>
    localDB.runs.clear()
      .then(() => {
        dispatch(({
          type: CLEAR_RUNS,
          payload: null,
        }));
      })
);

export const getLocalRun = applyAsyncLoading(runId =>
  () =>
    localDB.runs.get(runId)
      .then((run) => {
        return run;
      })
);

export const getDBRuns = applyAsyncLoading(() =>
  dispatch =>
    localDB.runs // .where('id').startsWith('local')
      .toArray()
      .then((runs) => {
        dispatch(({
          type: GET_DB_RUNS,
          payload: runs,
        }));
        return runs;
      })
);

export const saveLocalRun = applyAsyncLoading(run =>
  dispatch =>
    localDB.runs.put(run)
      .then((key) => {
        dispatch(({
          type: SAVE_LOCAL_RUN,
          payload: run,
        }));
        return key;
      })
);

const INITIAL_STATE = {
  localRuns: [],
  remoteRuns: [],
  runs: [],
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_RUNS:
      return INITIAL_STATE;
    case GET_DB_RUNS: {
      const localRuns = [];
      const remoteRuns = [];

      action.payload.forEach((run) => {
        if (run.type === 'local') {
          localRuns.push(run);
        } else {
          remoteRuns.push(run);
        }
      });

      return {
        ...state, localRuns, remoteRuns, runs: [...remoteRuns, ...localRuns],
      };
    }
    case SAVE_LOCAL_RUN: {
      const localRuns = [...state.localRuns];
      const index = localRuns.findIndex(run => run.id === action.payload.id);

      if (index === -1) {
        localRuns.push(action.payload);
      } else {
        localRuns.splice(index, 1, action.payload);
      }

      return { ...state, localRuns, runs: [...state.remoteRuns, ...localRuns] };
    }
    case SAVE_REMOTE_RUNS_LOCALLY: {
      const remoteRuns = [...state.remoteRuns];
      action.payload.forEach((payloadRun) => {
        const index = remoteRuns.findIndex(localRun => localRun.id === payloadRun.id);
        if (index === -1) {
          remoteRuns.push(payloadRun);
        }
      });

      return { ...state, remoteRuns, runs: [...remoteRuns, ...state.localRuns] };
    }
    default:
      return state;
  }
}
