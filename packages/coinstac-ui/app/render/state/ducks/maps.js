import {
  dirname,
  join,
  isAbsolute,
  resolve,
} from 'path';
import { applyAsyncLoading } from './loading';

const SAVE_DATA_MAPPING = 'SAVE_DATA_MAPPING';
const DELETE_DATA_MAPPING = 'DELETE_DATA_MAPPING';
const DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM = 'DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM';

const INITIAL_STATE = {
  consortiumDataMappings: [],
};

export const saveDataMapping = applyAsyncLoading(
  (consortiumId, pipelineId, map) => async (dispatch) => {
    const mapping = {
      consortiumId,
      pipelineId,
      map,
    };

    dispatch(({
      type: SAVE_DATA_MAPPING,
      payload: mapping,
    }));
  }
);

export const deleteDataMapping = applyAsyncLoading(
  (consortiumId, pipelineId) => async (dispatch) => {
    dispatch(({
      type: DELETE_DATA_MAPPING,
      payload: {
        consortiumId,
        pipelineId,
      },
    }));
  }
);

export const deleteAllDataMappingsFromConsortium = applyAsyncLoading(
  consortiumId => async (dispatch) => {
    dispatch(({
      type: DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM,
      payload: consortiumId,
    }));
  }
);

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SAVE_DATA_MAPPING:
      return {
        ...state,
        consortiumDataMappings: [...state.consortiumDataMappings, action.payload],
      };
    case DELETE_DATA_MAPPING:
      return {
        ...state,
        consortiumDataMappings: state.consortiumDataMappings
          .filter(map => map.consortiumId !== action.payload.consortiumId
            || map.pipelineId !== action.payload.pipelineId),
      };
    case DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM:
      return {
        ...state,
        consortiumDataMappings: state.consortiumDataMappings
          .filter(map => map.consortiumId !== action.payload),
      };
    default:
      return state || INITIAL_STATE;
  }
}
