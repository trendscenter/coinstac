const INITIAL_STATE = {
  logs: null,
};

// Actions
const APPEND_LOG_MESSAGE = 'APPEND_LOG_MESSAGE';

// Action Creators
export const appendLogMessage = message => ({ type: APPEND_LOG_MESSAGE, payload: message });

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case APPEND_LOG_MESSAGE:
      return {
        ...state,
        logs: state.logs ? state.logs.concat(action.payload) : action.payload,
      };
    default:
      return state;
  }
}
