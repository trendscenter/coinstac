const SAVE_SUSPENDED_RUN = 'SAVE_SUSPENDED_RUN';
const DELETE_SUSPENDED_RUN = 'DELETE_SUSPENDED_RUN';

const INITIAL_STATE = {};

export const selectSuspendedRunsStates = state => state.suspendedRuns;

export const saveSuspendedRun = (runId, runState) => ({
  type: SAVE_SUSPENDED_RUN,
  payload: {
    runId,
    runState,
  },
});

export const deleteSuspendedRun = runId => ({
  type: DELETE_SUSPENDED_RUN,
  payload: {
    runId,
  },
});

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SAVE_SUSPENDED_RUN:
      return {
        ...state,
        [action.payload.runId]: action.payload.runState,
      };
    case DELETE_SUSPENDED_RUN:
      return Object.keys(state)
        .filter(runId => runId !== action.payload.runId)
        .reduce((aggregate, runId) => {
          aggregate[runId] = state[runId];
          return aggregate;
        }, {});
    default:
      return state;
  }
}
