/* eslint-disable no-case-declarations */
import { dirname, basename } from 'path';
import isEqual from 'lodash/isEqual';
import { applyAsyncLoading } from './loading';
import { startRun } from './runs';
import { getAllUnfulfilledPipelineInputs } from '../../utils/helpers';

const SAVE_DATA_MAPPING = 'SAVE_DATA_MAPPING';
const UPDATE_MAP_STATUS = 'UPDATE_MAP_STATUS';
const DELETE_DATA_MAPPING = 'DELETE_DATA_MAPPING';
const DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM = 'DELETE_ALL_DATA_MAPPINGS_FROM_CONSORTIUM';

const INITIAL_STATE = {
  consortiumDataMappings: [],
};

const castData = {
  number: (d) => {
    try {
      return parseFloat(d);
    } catch (e) {
      throw new Error(`Could not convert ${d} to a number: ${e}`);
    }
  },
  boolean: (d) => {
    try {
      if (d === true || d === false) return d;
      if (['false', '0'].indexOf(d.toLowerCase()) > -1) {
        return false;
      }
      if (['true', '1'].indexOf(d.toLowerCase()) > -1) {
        return true;
      }
      throw new Error(`Could not convert ${d} to a boolean`);
    } catch (e) {
      throw new Error(`Could not convert ${d} to a boolean: ${e}`);
    }
  },
  string: d => d,
};
export const saveDataMapping = applyAsyncLoading(
  (consortium, pipeline, map) => async (dispatch, getState) => {
    const mapData = [];

    pipeline.steps.forEach((step) => {
      const filesArray = [];
      const directoryArray = [];
      const inputMap = {};
      let baseDirectory = null;

      Object.keys(step.inputMap).forEach((inputMapKey) => {
        inputMap[inputMapKey] = { ...step.inputMap[inputMapKey] };

        if (inputMap[inputMapKey].fulfilled) {
          return;
        }

        const mappedData = map[inputMapKey];

        if (mappedData) {
          // has csv column mapping
          if (mappedData.fieldType === 'csv') {
            const value = {};
            const inputMapVariables = inputMap[inputMapKey].value.map(field => field.name);
            const csvData = { ...mappedData.fileData[0].data };

            baseDirectory = dirname(mappedData.files[0]);

            Object.keys(csvData).forEach((subj) => {
              value[subj] = {};
              filesArray.push(subj);

              inputMapVariables.forEach((mappedColumnName) => {
                const covarType = inputMap[inputMapKey].value
                  .find(c => c.name === mappedColumnName);
                const csvColumn = mappedData.maps[mappedColumnName];
                try {
                  value[subj][mappedColumnName] = castData[covarType.type](
                    csvData[subj][csvColumn]
                  );
                } catch (e) {
                  throw new Error(`Issue converting column ${csvColumn}: ${e}`);
                }
              });
            });

            inputMap[inputMapKey].value = value;
          } else if (mappedData.fieldType === 'files') {
            baseDirectory = dirname(mappedData.files[0]);
            filesArray.push(...mappedData.files);

            inputMap[inputMapKey].value = mappedData.files.map(file => basename(file));
          } else if (mappedData.fieldType === 'directory') {
            directoryArray.push(mapData.directory);
            inputMap[inputMapKey].value = mappedData.directory;
          } else if (mappedData.fieldType === 'boolean' || mappedData.fieldType === 'number'
            || mappedData.fieldType === 'object' || mappedData.fieldType === 'text') {
            inputMap[inputMapKey].value = mappedData.value;
          }
        }

        inputMap[inputMapKey].fulfilled = true;
      });

      mapData.push({
        filesArray,
        directoryArray,
        baseDirectory,
        inputMap,
      });
    });

    const mapping = {
      consortiumId: consortium.id,
      pipelineId: pipeline.id,
      pipelineSnapshot: pipeline,
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

// Called when a pipeline is edited to update the map status accordingly
export const updateMapStatus = applyAsyncLoading(
  (consortiumId, pipeline) => async (dispatch, getState) => {
    const { maps } = getState();

    const currentMap = maps.consortiumDataMappings.find(
      m => m.consortiumId === consortiumId && m.pipelineId === pipeline.id
    );

    if (!currentMap) return;

    if (!currentMap.pipelineSnapshot) {
      return dispatch({
        type: UPDATE_MAP_STATUS,
        payload: {
          consortiumId,
          pipelineId: pipeline.id,
          complete: false,
          map: currentMap.map,
        },
      });
    }

    const newPipelineInputs = getAllUnfulfilledPipelineInputs(pipeline);
    const oldPipelineInputs = getAllUnfulfilledPipelineInputs(currentMap.pipelineSnapshot);

    const unfulfilledInputsAreEqual = isEqual(newPipelineInputs, oldPipelineInputs);

    function mergeFulfilledPipelineInputs() {
      if (!currentMap.map || !currentMap.map.length) return;

      const mergedMap = [...currentMap.map];

      pipeline.steps.forEach((step, stepIndex) => {
        const stepMap = {
          ...mergedMap[stepIndex],
          inputMap: {
            ...mergedMap[stepIndex].inputMap,
          },
        };

        Object.keys(step.inputMap).forEach((inputMapKey) => {
          if (!step.inputMap[inputMapKey].fulfilled) return;

          stepMap.inputMap[inputMapKey] = { ...step.inputMap[inputMapKey] };
        });

        mergedMap[stepIndex] = stepMap;
      });

      return mergedMap;
    }

    let mergedMap;
    if (unfulfilledInputsAreEqual) {
      mergedMap = mergeFulfilledPipelineInputs();
    }

    dispatch(({
      type: UPDATE_MAP_STATUS,
      payload: {
        consortiumId,
        pipelineId: pipeline.id,
        pipelineSnapshot: pipeline,
        map: mergedMap || currentMap.map,
        complete: unfulfilledInputsAreEqual,
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
                pipelineSnapshot: action.payload.pipelineSnapshot,
                map: action.payload.map,
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
