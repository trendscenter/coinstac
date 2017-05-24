const SET_EXPANDED_RESULT = 'SET_EXPANDED_RESULT';

export const setExpandedResult = (resultId) => {
  return {
    type: SET_EXPANDED_RESULT,
    payload: resultId,
  };
};

const INITIAL_STATE = {
  expandedResult: '',
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_EXPANDED_RESULT:
      return { expandedResult: action.payload };
    default:
      return state;
  }
}
