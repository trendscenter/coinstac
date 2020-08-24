import { takeRight } from 'lodash';

const INITIAL_STATE = {
  logs: [],
};

// Actions
const APPEND_LOG_MESSAGE = 'APPEND_LOG_MESSAGE';

const exp = new RegExp(/(\{"message":.+"level":.+\})/g);

// Action Creators
export const appendLogMessage = message => ({ type: APPEND_LOG_MESSAGE, payload: message });

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case APPEND_LOG_MESSAGE:
      // eslint-disable-next-line no-case-declarations
      const logs = action.payload.replace(/},{/g, '}\n{').match(exp);

      return {
        ...state,
        logs: takeRight([...state.logs, ...logs], 500),
      };
    default:
      return state;
  }
}
