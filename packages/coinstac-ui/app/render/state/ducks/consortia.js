import app from 'ampersand-app';
import { get as getStore } from '../store';
import { applyAsyncLoading } from './loading';
import sortBy from 'lodash/sortBy';
import findIndex from 'lodash/findIndex';


const SET_CONSORTIA = 'SET_CONSORTIA';
const BG_SET_CONSORTIA = 'BG_SET_CONSORTIA';
export const setConsortia = (consortia, isBg) => ({
  type: isBg ? BG_SET_CONSORTIA : SET_CONSORTIA,
  consortia,
});

export const fetchConsortia = applyAsyncLoading(function fetchConsortia() {
  return (dispatch) => {
    return app.core.consortia.all()
    .then((consortia) => {
      dispatch(setConsortia(consortia));
      return consortia;
    })
    .catch((err) => {
      app.notify('error', `Unable to download consortia: ${err}`);
      throw err;
    });
  };
});

/**
 * efficiently update consortia state given a set of consortia which may
 * be new or updated.
 * @param {object} opts
 * @param {function} dispatch redux dispatcher
 * @param {object|object[]} toUpdate POJO consortium/tia to patch onto existing state
 * @param {boolean} [isBg] indicates that this patch has originated from bg-service (vs. user)
 * @returns {undefined}
 */
export const updateConsortia = ({ dispatch, toUpdate, isBg }) => {
  const currTia = getStore().getState().consortia;
  if (!currTia) { return; }
  if (!Array.isArray(toUpdate)) {
    toUpdate = [toUpdate];
  }
  toUpdate.forEach((changed) => {
    const toSwapNdx = findIndex(currTia, { _id: changed._id });
    if (toSwapNdx >= 0) {
      currTia[toSwapNdx] = changed;
    } else {
      currTia.push(changed);
    }
  });
  dispatch(setConsortia(currTia, isBg));
};

export default function reducer(state = null, action) {
  switch (action.type) {
    case BG_SET_CONSORTIA:
    case SET_CONSORTIA:
      if (action.consortia === null) {
        return null;
      }
      return [...sortBy(action.consortia, 'label')];
    default:
      return state;
  }
}
