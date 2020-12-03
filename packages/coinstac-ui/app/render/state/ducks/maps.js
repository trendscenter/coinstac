import { dirname, basename } from 'path';
import { applyAsyncLoading } from './loading';

const SAVE_DATA_MAPPING = 'SAVE_DATA_MAPPING';
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
  (consortiumId, pipeline, map) => async (dispatch) => {
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
      consortiumId,
      pipelineId: pipeline.id,
      map: mapData,
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
