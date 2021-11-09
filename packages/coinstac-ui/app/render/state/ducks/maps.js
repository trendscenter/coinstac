/* eslint-disable no-case-declarations */
import { dirname, basename } from 'path';
import { applyAsyncLoading } from './loading';
import { startRun } from './runs';

const SAVE_DATA_MAPPING = 'SAVE_DATA_MAPPING';
const UPDATE_MAP_STATUS = 'UPDATE_MAP_STATUS';
const DELETE_DATA_MAPPING = 'DELETE_DATA_MAPPING';
const DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM = 'DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM';

const INITIAL_STATE = {
  consortiumDataMappings: [],
};

// map
// {
//   covariates: {
//     fileData: [{
//       data: {
//         subject0_aseg_stats.txt: {isControl: 'False', age: 22}
//         subject1_aseg_stats.txt: {isControl: 'True', age: 47}
//       }
//     }],
//     files: [],
//     maps: {isControl: 'isControl', age: 'age'}
//   }
// }

// inputMap covariates value
// [
//   {type: 'boolean', name: 'isControl'},
//   {type: 'number', name: 'age'}
// ]

export const saveDataMapping = applyAsyncLoading(
  (consortium, pipeline, map) => async (dispatch, getState) => {
    const mapData = [];

    pipeline.steps.forEach((step) => {
      const filesArray = [];
      const inputMap = {};
      let baseDirectory = null;

      Object.keys(step.inputMap).forEach((inputMapKey) => {
        inputMap[inputMapKey] = { ...step.inputMap[inputMapKey] };

        if (inputMap[inputMapKey].fulfilled) {
          return;
        }

        const inputMapVariables = inputMap[inputMapKey].value.map(field => field.name);
        const mappedData = map[inputMapKey];

        // has csv column mapping
        if (mappedData.maps) {
          const value = { ...mappedData.fileData[0].data };

          baseDirectory = dirname(mappedData.files[0]);

          Object.keys(value).forEach((valueKey) => {
            filesArray.push(valueKey);

            inputMapVariables.forEach((variable) => {
              const columnName = mappedData.maps[variable];

              if (columnName) {
                value[valueKey][variable] = value[valueKey][columnName];

                if (columnName !== variable) {
                  delete value[valueKey][columnName];
                }
              }
            });
          });

          inputMap[inputMapKey].value = value;
        } else {
          baseDirectory = dirname(mappedData.files[0]);
          filesArray.push(...mappedData.files);

          inputMap[inputMapKey].value = mappedData.files.map(file => basename(file));
        }
      });

      mapData.push({
        filesArray,
        baseDirectory,
        inputMap,
      });
    });

    const mapping = {
      consortiumId: consortium.id,
      pipelineId: pipeline.id,
      map: mapData,
      dataMap: map,
      isComplete: true,
    };

    dispatch({
      type: SAVE_DATA_MAPPING,
      payload: mapping,
    });

    const { runs } = getState();

    const runAwaitingDataMap = runs.runsAwaitingDataMap.filter(
      run => run.consortiumId === consortium.id && run.pipelineSnapshot.id === pipeline.id
    );

    if (runAwaitingDataMap) {
      dispatch(startRun(runAwaitingDataMap, consortium));
    }
  }
);

export const updateMapStatus = applyAsyncLoading(
  (consortiumId, pipelineId, complete) => async (dispatch) => {
    dispatch(({
      type: UPDATE_MAP_STATUS,
      payload: {
        consortiumId,
        pipelineId,
        complete,
      },
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
      let updated = false;

      const newDataMappings = state.consortiumDataMappings.map((map) => {
        if (map.consortiumId === action.payload.consortiumId
          && map.pipelineId === action.payload.pipelineId
        ) {
          updated = true;
          return action.payload;
        }

        return map;
      });

      if (!updated) {
        newDataMappings.push(action.payload);
      }

      return {
        ...state,
        consortiumDataMappings: newDataMappings,
      };
    case UPDATE_MAP_STATUS:
      return {
        ...state,
        consortiumDataMappings: state.consortiumDataMappings
          .map((map) => {
            if (map.consortiumId === action.payload.consortiumId
              && map.pipelineId === action.payload.pipelineId
            ) {
              return {
                ...map,
                isComplete: action.payload.complete,
              };
            }

            return map;
          }),
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
