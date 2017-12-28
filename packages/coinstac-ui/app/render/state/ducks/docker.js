'use strict';

import ipcPromise from 'ipc-promise';
import { applyAsyncLoading } from './loading';

// Actions
export const CLEAR_DOCKER_OUTPUT = 'CLEAR_DOCKER_OUTPUT';
export const PULL_COMPUTATIONS = 'PULL_COMPUTATIONS';
export const UPDATE_DOCKER_OUTPUT = 'UPDATE_DOCKER_OUTPUT';

// Action Creators
export const pullComputations = applyAsyncLoading((compsAndConsortiumId) => {
  return (dispatch) => {
    dispatch({ payload: '', type: CLEAR_DOCKER_OUTPUT });
    return ipcPromise.send('download-comps', compsAndConsortiumId)
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
  dockerOut: [],
  dlComplete: false,
  localImages: [],
};

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_DOCKER_OUTPUT:
      return { ...state, dockerOut: [] };
    case PULL_COMPUTATIONS:
      return { ...state, dlComplete: action.payload };
    case UPDATE_DOCKER_OUTPUT: {
      const newDockerOut = [...state.dockerOut];
      action.payload.forEach((newOut) => {
        let elemIndex = -1;

        if (newOut.id && newOut.id !== 'latest') {
          elemIndex = newDockerOut.findIndex(currentOut => newOut.id === currentOut.id);
        } else if (newOut.id && newOut.id === 'latest') {
          elemIndex = newDockerOut.findIndex(currentOut =>
            newOut.id === currentOut.id && newOut.status === currentOut.status
          );
        }

        if (elemIndex === -1 && !newOut.id) {
          elemIndex = newDockerOut.findIndex(currentOut => newOut.status === currentOut.status);
        }

        if (elemIndex === -1) {
          newDockerOut.push(newOut);
        } else {
          newDockerOut[elemIndex] = newOut;
        }
      });
      return { ...state, dockerOut: newDockerOut };
    }
    default:
      return state;
  }
}
