'use strict';

import { ipcRenderer } from 'electron';

import { applyAsyncLoading } from './loading';
import { notifyError, notifySuccess } from './notifyAndLog';

// Actions
export const CLEAR_DOCKER_OUTPUT = 'CLEAR_DOCKER_OUTPUT';
export const GET_LOCAL_IMAGES = 'GET_LOCAL_IMAGES';
export const GET_DOCKER_STATUS = 'GET_DOCKER_STATUS';
export const PULL_COMPUTATIONS = 'PULL_COMPUTATIONS';
export const REMOVE_IMAGE = 'REMOVE_IMAGE';
export const UPDATE_DOCKER_OUTPUT = 'UPDATE_DOCKER_OUTPUT';

// Action Creators
export const getDockerImages = applyAsyncLoading(() => dispatch => ipcRenderer.invoke('get-all-images')
  .then(res => dispatch({ payload: res, type: GET_LOCAL_IMAGES })));

export const pullComputations = applyAsyncLoading(compsAndConsortiumId => dispatch => ipcRenderer.invoke('download-comps', compsAndConsortiumId)
  .then((res) => {
    dispatch({ payload: true, type: PULL_COMPUTATIONS });
    return res;
  })
  .catch((err) => {
    dispatch({ payload: false, type: PULL_COMPUTATIONS });
    return err;
  }));

export const removeImage = applyAsyncLoading((compId, imgName, imgId) => dispatch => ipcRenderer.invoke('remove-image', { compId, imgId, imgName })
  .then(() => {
    dispatch({ payload: imgName, type: REMOVE_IMAGE });
  }));

export const updateDockerOutput = (output => (dispatch) => {
  if (output.output[0].status && output.output[0].status === 'error') {
    dispatch(notifyError(`Docker Error with ${output.compName}`));
  } else if (output.output[0].id && output.output[0].id.indexOf('-complete') > -1) {
    dispatch(notifySuccess(`${output.compName} Download Complete`));
    dispatch(getDockerImages());
  }

  dispatch({ payload: output, type: UPDATE_DOCKER_OUTPUT });
}
);

const INITIAL_STATE = {
  dockerOut: {},
  dlComplete: false,
  localImages: {},
};

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_DOCKER_OUTPUT:
      return { ...state, dockerOut: {} };
    case GET_LOCAL_IMAGES: {
      const localImages = {};
      action.payload.forEach((image) => {
        if (image.RepoTags) {
          const name = image.RepoTags[0]?.split(':')[0];
          localImages[name] = { id: image.Id, size: image.Size };
        } else if (image.RepoDigests) {
          const name = image.RepoDigests[0]?.split('@')[0];
          localImages[name] = { id: image.Id, size: image.Size };
        }
      });
      return { ...state, localImages };
    }
    case PULL_COMPUTATIONS:
      return { ...state, dlComplete: action.payload };
    case REMOVE_IMAGE: {
      const { localImages } = state;
      delete localImages[action.payload];
      return { ...state, localImages };
    }
    case UPDATE_DOCKER_OUTPUT: {
      const { compId, output } = action.payload;
      const { dockerOut } = state;
      let complete = false;
      let outputCopy = [];
      if (dockerOut[compId]) {
        outputCopy = [...dockerOut[compId]];
      }

      output.forEach((newOut) => {
        let elemIndex = -1;

        if (newOut.id && newOut.id !== 'latest') {
          elemIndex = outputCopy.findIndex(currentOut => newOut.id === currentOut.id);
        } else if (newOut.id && newOut.id === 'latest') {
          elemIndex = outputCopy.findIndex(
            currentOut => newOut.id === currentOut.id && newOut.status === currentOut.status,
          );
        }

        if (elemIndex === -1 && !newOut.id) {
          elemIndex = outputCopy
            .findIndex(currentOut => newOut.status === currentOut.status);
        }

        if (newOut.id && newOut.status && newOut.id.indexOf('-complete') > -1 && newOut.status === 'complete') {
          complete = true;
        } else if (elemIndex === -1) {
          outputCopy.push(newOut);
        } else {
          outputCopy[elemIndex] = newOut;
        }
      });

      if (complete) {
        outputCopy = null;
      }

      return { ...state, dockerOut: { ...state.dockerOut, [compId]: outputCopy } };
    }
    default:
      return state;
  }
}
