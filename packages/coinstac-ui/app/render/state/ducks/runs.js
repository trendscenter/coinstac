import { ipcRenderer } from 'electron';
import { persistReducer } from 'redux-persist';

import { saveLocalRunResult } from './localRunResults';
import { notifyInfo, notifyError } from './notifyAndLog';
import { pipelineNeedsDataMapping } from '../../utils/helpers';

/**
 * We currently merge local runs and remote runs in a redux store. The local runs are persisted
 * locally through redux-persist while the remote runs are fed into the store when the app starts
 * and whenever the user starts new runs.
 */

// Actions
const CLEAR_RUNS = 'CLEAR_RUNS';
const LOAD_LOCAL_RUNS = 'LOAD_LOCAL_RUNS';
const SAVE_RUN = 'SAVE_RUN';
const UPDATE_RUN = 'UPDATE_RUN';
const SAVE_RUN_AWAITING_MAP = 'SAVE_RUN_AWAITING_MAP';
const REMOVE_RUN_AWAITING_MAP = 'REMOVE_RUN_AWAITING_MAP';
const DELETE_RUN = 'DELETE_RUN';

// Action Creators
export const clearRuns = () => (dispatch) => {
  dispatch({
    type: CLEAR_RUNS,
    payload: null,
  });
};

export const startRun = (run, consortium) => (dispatch, getState) => {
  const { maps, auth } = getState();

  if (!consortium) {
    dispatch(notifyError('Consortium no longer exists for pipeline run.'));
    return;
  }

  const dataMap = maps.consortiumDataMappings.find(m => m.consortiumId === consortium.id
    && m.pipelineId === consortium.activePipelineId);

  if (pipelineNeedsDataMapping(run.pipelineSnapshot) && !dataMap) {
    dispatch(notifyInfo(`Run for ${consortium.name} is waiting for your data. Please map your data to take part of the consortium.`));
    dispatch({
      type: SAVE_RUN_AWAITING_MAP,
      payload: run,
    });
    return;
  }

  dispatch(notifyInfo(`Pipeline Starting for ${consortium.name}.`));
  dispatch({
    type: REMOVE_RUN_AWAITING_MAP,
    payload: run.id,
  });

  ipcRenderer.send('start-pipeline', {
    consortium,
    dataMappings: dataMap,
    pipelineRun: run,
    networkVolume: auth.networkVolume,
  });
};

export const loadLocalRuns = () => ({
  type: LOAD_LOCAL_RUNS,
});

export const saveRunLocally = (run, isNew = false) => (dispatch, getState) => {
  if (run.type === 'local') {
    const { localRunResults } = getState();

    if (!isNew && !(run.id in localRunResults)) return;

    run = {
      ...run,
      ...localRunResults[run.id],
    };
  }

  dispatch({
    type: SAVE_RUN,
    payload: run,
  });
};

export const updateRunLocally = (runId, object) => (dispatch) => {
  dispatch({
    type: UPDATE_RUN,
    payload: { runId, object },
  });

  if (object.type === 'local' && (object.status === 'error' || object.status === 'complete')) {
    dispatch(saveLocalRunResult(runId, object));
  }
};

export const deleteRun = runId => (dispatch) => {
  dispatch({
    type: DELETE_RUN,
    payload: { runId },
  });
};

const INITIAL_STATE = {
  runs: [],
  localRuns: [],
  runsAwaitingDataMap: [],
};

function runSort(a, b) {
  return b.startDate - a.startDate;
}

// REDUCER
function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    // TODO: Handle runs delete in reducer
    case CLEAR_RUNS:
      return INITIAL_STATE;
    case LOAD_LOCAL_RUNS:
      return {
        ...state,
        runs: state.localRuns ? [...state.localRuns] : [],
      };
    case SAVE_RUN: {
      const runs = [...state.runs];
      const index = runs.findIndex(run => run.id === action.payload.id);

      if (index === -1) {
        runs.push(action.payload);
      } else {
        runs.splice(index, 1, action.payload);
      }

      let localRunsCopy = state.localRuns;
      if (action.payload.type === 'local') {
        localRunsCopy = [...state.localRuns];

        const index = localRunsCopy.findIndex(run => run.id === action.payload.id);

        if (index === -1) {
          localRunsCopy.push(action.payload);
        } else {
          localRunsCopy.splice(index, 1, action.payload);
        }
      }

      return { ...state, runs: runs.sort(runSort), localRuns: localRunsCopy };
    }
    case UPDATE_RUN: {
      const runs = [...state.runs];
      const index = runs.findIndex(run => run.id === action.payload.runId);

      if (index >= 0) {
        runs[index] = { ...runs[index], ...action.payload.object };

        let localRunsCopy = state.localRuns;
        if (action.payload.object.type === 'local') {
          localRunsCopy = [...state.localRuns];

          const localIndex = runs.findIndex(run => run.id === action.payload.runId);

          if (localIndex >= 0) {
            localRunsCopy[index] = { ...localRunsCopy[index], ...action.payload.object };
          }
        }

        return { ...state, runs, localRuns: localRunsCopy };
      }

      return state;
    }
    case SAVE_RUN_AWAITING_MAP: {
      return {
        ...state,
        runsAwaitingDataMap: [...state.runsAwaitingDataMap, action.payload],
      };
    }
    case REMOVE_RUN_AWAITING_MAP: {
      return {
        ...state,
        runsAwaitingDataMap: state.runsAwaitingDataMap.filter(run => run.id !== action.payload),
      };
    }
    case DELETE_RUN: {
      return {
        ...state,
        runs: state.runs.filter(run => run.id !== action.payload.runId),
        runsAwaitingDataMap:
          state.runsAwaitingDataMap.filter((run) => { return run.id !== action.payload.runId; }),
        localRuns: state.localRuns.filter(run => run.id !== action.payload.runId),
        remoteRuns: state.remoteRuns.filter(run => run.id !== action.payload.runId),
      };
    }
    default:
      return state;
  }
}

export default function createReducer(persistStorage) {
  const runsPersistConfig = {
    key: 'runs',
    storage: persistStorage,
    whitelist: ['localRuns'],
  };

  return persistReducer(runsPersistConfig, reducer);
}
