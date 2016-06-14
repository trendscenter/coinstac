import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';
import { get as getStore } from '../store';
import findIndex from 'lodash/findIndex';


const SET_COMPUTATIONS = 'SET_COMPUTATIONS';
const BG_SET_COMPUTATIONS = 'BG_SET_COMPUTATIONS';
export const setComputations = (computations, isBg) => ({
  type: isBg ? BG_SET_COMPUTATIONS : SET_COMPUTATIONS,
  computations,
});

export const fetchComputations = applyAsyncLoading(function fetchComputations() {
  return (dispatch) => {
    return app.core.computations.all()
    .then((computations) => {
      dispatch(setComputations(computations));
      return computations;
    })
    .catch((err) => app.notify('error', `Unable to download computations: ${err}`));
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
export const updateComputations = ({ dispatch, toUpdate, isBg }) => {
  const currComps = getStore().getState().computations;
  if (!currComps) { return; }
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

export default function reducer(state = null, action) {
  switch (action.type) {
    case BG_SET_COMPUTATIONS:
    case SET_COMPUTATIONS:
      if (action.computations === null) {
        return null;
      }
      return [...action.computations];
    default:
      return state;
  }
}
