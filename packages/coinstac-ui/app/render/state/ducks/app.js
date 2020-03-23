const INITIAL_STATE = {
  logs: null,
};

// Actions
const CLEAR_LOGS = 'CLEAR_LOGS';
const APPEND_LOG_MESSAGE = 'APPEND_LOG_MESSAGE';

// Action Creators
export const clearLogs = () => ({ type: CLEAR_LOGS });

export const appendLogMessage = message => ({ type: APPEND_LOG_MESSAGE, payload: message });

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_LOGS:
      return {
        ...state,
        logs: null,
      };
    case APPEND_LOG_MESSAGE:
      return {
        ...state,
        logs: state.logs ? state.logs.concat(action.payload) : action.payload,
      };
    default:
      return state;
  }
}
