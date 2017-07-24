const SET_EXPANDED_RESULTS = 'SET_EXPANDED_RESULT';

export const setExpandedResults = (resultId) => {
  return {
    type: SET_EXPANDED_RESULTS,
    payload: resultId,
  };
};

const INITIAL_STATE = {
  expandedResults: [],
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_EXPANDED_RESULTS:
      if (state.expandedResults.includes(action.payload)) {
        return {
          expandedResults: state.expandedResults.filter(res => res !== action.payload),
        };
      } else if (action.payload !== null) {
        return {
          expandedResults: [action.payload, ...state.expandedResults],
        };
      }
      return { expandedResults: [] };
    default:
      return state;
  }
}
