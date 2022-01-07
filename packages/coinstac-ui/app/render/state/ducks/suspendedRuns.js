const SAVE_SUSPENDED_RUN = 'SAVE_SUSPENDED_RUN';
const DELETE_SUSPENDED_RUN = 'DELETE_SUSPENDED_RUN';

const INITIAL_STATE = {};

export const saveSuspendedRun = runId => ({
  type: SAVE_SUSPENDED_RUN,
  payload: {
    runId,
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
        runsState: {
          ...state.runState,
          [action.payload.runId]: true,
        },
      };
    case DELETE_SUSPENDED_RUN:
      return {
        ...state,
        runsState: Object.keys(state.runsState)
          .filter(runId => runId !== action.payload.runId)
          .reduce((aggregate, runId) => {
            aggregate[runId] = state.runsState[runId];
            return aggregate;
          }, {}),
      };
    default:
      return state;
  }
}
