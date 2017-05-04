'use strict';

import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';

const SET_COMPUTATION = 'SET_COMPUTATION';
export const setComputation = (computation) => ({ computation, type: SET_COMPUTATION });

export const fetchComputation = applyAsyncLoading(id => {
  return (dispatch) => {
    return app.core.computations.get(id)
    .then((computation) => {
      dispatch(setComputation(computation));
      return computation;
    })
    .catch((err) => {
      app.notify({
        level: 'error',
        message: 'Failed to fetch computation',
      });
      throw err;
    });
  };
});

export default function reducer(state = null, action) {
  switch (action.type) {
    case SET_COMPUTATION:
      if (action.computation === null) { return null; }
      return Object.assign({}, action.computation);
    default:
      return state;
  }
}
