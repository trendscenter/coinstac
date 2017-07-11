'use strict';

import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';
import { findIndex } from 'lodash';

const SET_COMPUTATION = 'SET_COMPUTATION';
const SET_COMPUTATIONS = 'SET_COMPUTATIONS';
const BG_SET_COMPUTATIONS = 'BG_SET_COMPUTATIONS';

const setComputation = (computation) => ({ payload: computation, type: SET_COMPUTATION });
const setComputations = (computations, isBg) => ({
  type: isBg ? BG_SET_COMPUTATIONS : SET_COMPUTATIONS,
  payload: computations,
});

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

export const fetchComputations = applyAsyncLoading(() => {
  return (dispatch) => {
    return app.core.computations.all()
    .then((computations) => {
      dispatch(setComputations(computations));
      return computations;
    })
    .catch((err) => app.notify({
      level: 'error',
      message: `Unable to download computations: ${err}`,
    }));
  };
});

/**
 * efficiently update computation state given a set of computations which may
 * be new or updated.
 * @param {object} opts
 * @param {function} dispatch redux dispatcher
 * @param {object|object[]} toUpdate POJO computations to patch onto existing state
 * @param {boolean} [isBg] indicates that this patch has originated from bg-service (vs. user)
 * @returns {undefined}
 */
export const updateComputations = ({ toUpdate, isBg }) =>
  (dispatch, getState) => {
    const currComps = getState().computationsDuck.computations;
    if (!Array.isArray(toUpdate)) {
      toUpdate = [toUpdate];
    }
    toUpdate.forEach((changed) => {
      const toSwapNdx = findIndex(currComps, { _id: changed._id });
      if (toSwapNdx >= 0) {
        currComps[toSwapNdx] = changed;
      } else {
        currComps.push(changed);
      }
    });
    dispatch(setComputations(currComps, isBg));
  };

const INITIAL_STATE = {
  computation: null,
  computations: [],
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case BG_SET_COMPUTATIONS:
    case SET_COMPUTATION:
      return { ...state, computation: action.payload };
    case SET_COMPUTATIONS:
      return { ...state, computations: [...action.payload] };
    default:
      return state;
  }
}
