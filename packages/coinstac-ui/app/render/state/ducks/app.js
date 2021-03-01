import {
  compact, map, split, takeRight,
} from 'lodash';

const INITIAL_STATE = {
  logs: [],
};

// Actions
const APPEND_LOG_MESSAGE = 'APPEND_LOG_MESSAGE';

// Action Creators
export const appendLogMessage = message => ({ type: APPEND_LOG_MESSAGE, payload: message });

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case APPEND_LOG_MESSAGE:
      // eslint-disable-next-line no-case-declarations
      const logs = map(compact(split(action.payload, '}\n')), log => `${log}}`);

      return {
        ...state,
        logs: takeRight([...state.logs, ...logs], 500),
      };
    default:
      return state;
  }
}
