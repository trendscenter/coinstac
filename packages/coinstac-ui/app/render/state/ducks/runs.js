import { uniqBy } from 'lodash';
import { ipcRenderer } from 'electron';

import { saveLocalRunResult } from './localRunResults';
import { notifyInfo, notifyError } from './notifyAndLog';
import { pipelineNeedsDataMapping } from '../../utils/helpers';

// TODO: Create actions for deleting runs in redux state

// Actions
const CLEAR_RUNS = 'CLEAR_RUNS';
const SAVE_LOCAL_RUN = 'SAVE_LOCAL_RUN';
const UPDATE_LOCAL_RUN = 'UPDATE_LOCAL_RUN';
const SAVE_RUN_AWAITING_MAP = 'SAVE_RUN_AWAITING_MAP';
const REMOVE_RUN_AWAITING_MAP = 'REMOVE_RUN_AWAITING_MAP';

// Action Creators
export const clearRuns = () => ({
  type: CLEAR_RUNS,
  payload: null,
});

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

export const saveLocalRun = run => (dispatch, getState) => {
  if (run.type === 'local') {
    const { localRunResults } = getState();

    if (run.id in localRunResults) {
      run = {
        ...run,
        ...localRunResults[run.id],
      };
    }
  }

  dispatch({
    type: SAVE_LOCAL_RUN,
    payload: run,
  });
};

export const updateLocalRun = (runId, object) => (dispatch) => {
  dispatch({
    type: UPDATE_LOCAL_RUN,
    payload: { runId, object },
  });

  if (object.type === 'local' && (object.status === 'error' || object.status === 'complete')) {
    dispatch(saveLocalRunResult(runId, object));
  }
};

const INITIAL_STATE = {
  localRuns: [],
  remoteRuns: [],
  runs: [],
  runsAwaitingDataMap: [],
};

function runSort(a, b) {
  return b.startDate - a.startDate;
}

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    // TODO: Handle runs delete in reducer
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
    case SAVE_RUN_AWAITING_MAP: {
      return {
        ...state,
        runsAwaitingDataMap: [...state.runsAwaitingDataMap, action.payload],
      };
    }
    case REMOVE_RUN_AWAITING_MAP: {
      return {
        ...state,
        runsAwaitingDataMap: state.runsAwaitingDataMap.filter(run => run.id === action.payload),
      };
    }
    default:
      return state;
  }
}
