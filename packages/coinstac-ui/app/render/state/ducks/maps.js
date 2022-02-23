/* eslint-disable no-case-declarations */
import { dirname, basename } from 'path';
import { applyAsyncLoading } from './loading';
import { startRun } from './runs';

const fs = require('fs');
const path = require('path');

const SAVE_DATA_MAPPING = 'SAVE_DATA_MAPPING';
const UPDATE_MAP_STATUS = 'UPDATE_MAP_STATUS';
const DELETE_DATA_MAPPING = 'DELETE_DATA_MAPPING';
const DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM = 'DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM';

const INITIAL_STATE = {
  consortiumDataMappings: [],
};

const getAllFiles = ((dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles.push(path.join(__dirname, dirPath, file));
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, file));
    }
  });

  return arrayOfFiles;
});

export const saveDataMapping = applyAsyncLoading(
  (consortium, pipeline, map) => async (dispatch, getState) => {
    const mapData = [];

    pipeline.steps.forEach((step) => {
      let filesArray = [];
      const inputMap = {};
      let baseDirectory = null;
      const dataType = null;

      Object.keys(step.inputMap).forEach((inputMapKey) => {
        inputMap[inputMapKey] = { ...step.inputMap[inputMapKey] };

        if (inputMap[inputMapKey].fulfilled) {
          return;
        }

        const mappedData = map[inputMapKey];

        if (mappedData) {
          // has csv column mapping
          if (mappedData.fieldType === 'csv') {
            const inputMapVariables = inputMap[inputMapKey].value.map(field => field.name);

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
          } else if (mappedData.fieldType === 'files') {
            baseDirectory = dirname(mappedData.files[0]);
            filesArray.push(...mappedData.files);

            inputMap[inputMapKey].value = mappedData.files.map(file => basename(file));
          } else if (mappedData.fieldType === 'directory') {
            baseDirectory = mappedData.directory;
            const files = getAllFiles(mappedData.directory, null);
            files.unshift(baseDirectory);
            const newFiles = files.map((file) => {
              const normPath = baseDirectory.replace(/[/\\]/g, '\\/');
              const newfile = file.replace(new RegExp(`.*${normPath}`), '');
              return `${baseDirectory}${newfile}`;
            });
            filesArray = newFiles;
            files.shift();
            inputMap[inputMapKey].value = files.map((file) => {
              const normPath = baseDirectory.replace(/[/\\]/g, '\\/');
              const newfile = file.replace(new RegExp(`.*${normPath}`), '');
              return newfile;
            });
          } else if (mappedData.fieldType === 'boolean' || mappedData.fieldType === 'number'
            || mappedData.fieldType === 'object' || mappedData.fieldType === 'text') {
            inputMap[inputMapKey].value = mappedData.value;
          }
        }

        inputMap[inputMapKey].fulfilled = true;

        // carry dataType to the pipeline for processing files
        if (mappedData && ['csv', 'files', 'directory'].includes(mappedData.fieldType)) {
          inputMap[inputMapKey].type = mappedData.fieldType;
        }
      });

      mapData.push({
        filesArray,
        baseDirectory,
        inputMap,
        dataType,
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

    const runAwaitingDataMap = runs.runsAwaitingDataMap.find(
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
