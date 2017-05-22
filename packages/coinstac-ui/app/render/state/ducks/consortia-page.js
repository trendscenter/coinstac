const SET_EXPANDED_COMPUTATION = 'SET_EXPANDED_COMPUTATION';

export const setExpandedComputation = (computationId) => {
  return {
    type: SET_EXPANDED_COMPUTATION,
    payload: computationId
  };
};

const INITIAL_STATE = {
  expandedComputation: 'sfkfsdlfm',
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_EXPANDED_COMPUTATION:
      return {...state, expandedComputation: action.payload};
    default:
      return state;
  }
}