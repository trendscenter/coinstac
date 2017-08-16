'use strict';

import ipcPromise from 'ipc-promise';
import { applyAsyncLoading } from './loading';

// Actions
export const CLEAR_DOCKER_OUTPUT = 'CLEAR_DOCKER_OUTPUT';
export const GET_LOCAL_IMAGES = 'GET_LOCAL_IMAGES';
export const PULL_COMPUTATIONS = 'PULL_COMPUTATIONS';
export const REMOVE_CONTAINER = 'REMOVE_CONTAINER';
export const REMOVE_IMAGE = 'REMOVE_IMAGE';
export const UPDATE_DOCKER_OUTPUT = 'UPDATE_DOCKER_OUTPUT';

// Action Creators
export const getLocalImages = applyAsyncLoading(() => {
  return (dispatch) => {
    return ipcPromise.send('get-images')
    .then((res) => {
      dispatch({ payload: res, type: GET_LOCAL_IMAGES });
      return res;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
  };
});

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

export const removeContainer = applyAsyncLoading((containerId) => {
  return (dispatch) => {
    return ipcPromise.send('remove-container', containerId)
    .then((res) => {
      dispatch({ payload: containerId, type: REMOVE_CONTAINER });
      return res;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
  };
});

export const removeImage = applyAsyncLoading((imageId) => {
  return (dispatch) => {
    return ipcPromise.send('remove-image', imageId)
    .then((res) => {
      dispatch({ payload: imageId, type: REMOVE_IMAGE });
      return res;
    })
    .catch((err) => {
      console.log(err);
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
    case GET_LOCAL_IMAGES:
      return { ...state, localImages: action.payload };
    case PULL_COMPUTATIONS:
      return { ...state, dlComplete: action.payload };
    case REMOVE_CONTAINER:
      return {
        ...state,
        localImages: state.localImages.map((img) => {
          if (img[4] && img[4] === action.payload) {
            img.splice(4, 1);
          }

          return img;
        }) };
    case REMOVE_IMAGE:
      return {
        ...state,
        localImages: state.localImages.filter(img => img[0] !== action.payload)
      };
    case UPDATE_DOCKER_OUTPUT:
      return { ...state, dockerOut: action.payload.concat(state.dockerOut) };
    default:
      return state;
  }
}
