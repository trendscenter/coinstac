'use strict';

import ipcPromise from 'ipc-promise';
import { applyAsyncLoading } from './loading';

// Actions
export const CLEAR_DOCKER_OUTPUT = 'CLEAR_DOCKER_OUTPUT';
export const PULL_COMPUTATIONS = 'PULL_COMPUTATIONS';
export const UPDATE_DOCKER_OUTPUT = 'UPDATE_DOCKER_OUTPUT';

// Action Creators
export const pullComputations = applyAsyncLoading((computations) => {
  return (dispatch) => {
    dispatch({ payload: '', type: CLEAR_DOCKER_OUTPUT });
    return ipcPromise.send('download-comps', computations)
    .then((res) => {
      dispatch({ payload: true, type: PULL_COMPUTATIONS });
      return res;
    })
    .catch((err) => {
      dispatch({ payload: false, type: PULL_COMPUTATIONS });
      return err;
    });
  };
});

export const updateDockerOutput = output => ({ payload: output, type: UPDATE_DOCKER_OUTPUT });

const INITIAL_STATE = {
  dockerOut: '',
  dlComplete: false,
  localImages: [],
};

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_DOCKER_OUTPUT:
      return { ...state, dockerOut: '' };
    case PULL_COMPUTATIONS:
      return { ...state, dlComplete: action.payload };
    case UPDATE_DOCKER_OUTPUT:
      return { ...state, dockerOut: state.dockerOut.concat(action.payload) };
    default:
      return state;
  }
}
