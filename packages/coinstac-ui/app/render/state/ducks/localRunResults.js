const INITIAL_STATE = {};

const SAVE_LOCAL_RUN_RESULT = 'SAVE_LOCAL_RUN_RESULT';

export const saveLocalRunResult = (runId, result) => ({
  type: SAVE_LOCAL_RUN_RESULT,
  runId,
  result,
});

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SAVE_LOCAL_RUN_RESULT:
      return {
        ...state,
        [action.runId]: action.result,
      };
    default:
      return state || INITIAL_STATE;
  }
}
