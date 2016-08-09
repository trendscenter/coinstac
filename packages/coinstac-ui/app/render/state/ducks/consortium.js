'use strict';

import app from 'ampersand-app';
import * as util from './util';
import { updateConsortia } from './consortia';
import { applyAsyncLoading } from './loading';

const SET_CONSORTIUM = 'SET_CONSORTIUM';
export const setConsortium = (consortium) => ({ consortium, type: SET_CONSORTIUM });

export const fetchConsortium = applyAsyncLoading(id => {
  return (dispatch) => {
    return app.core.consortia.get(id)
    .then((consortium) => {
      dispatch(setConsortium(consortium));
      return consortium;
    })
    .catch((err) => {
      app.notify('error', 'Failed to fetch consortium');
      throw err;
    });
  };
});

/**
 * save (add/update) a consortium
 * @param {object} consortium
 * @returns {undefined}
 */
export const saveConsortium = applyAsyncLoading(consortium => {
  return (dispatch) => {
    return app.core.consortia.save(consortium)
    .then((newTium) => {
      dispatch(setConsortium(newTium));
      // swap consortium in consortia set, if present
      updateConsortia({ dispatch, toUpdate: newTium });
      return newTium;
    })
    .catch(util.notifyAndThow);
  };
});

export default function reducer(state = null, action) {
  switch (action.type) {
    case SET_CONSORTIUM:
      if (action.consortium === null) { return null; }
      return Object.assign({}, action.consortium);
    default:
      return state;
  }
}
