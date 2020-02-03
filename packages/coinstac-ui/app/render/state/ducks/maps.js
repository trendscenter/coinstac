import { dirname } from 'path';
import { applyAsyncLoading } from './loading';
import localDB from '../local-db';

const SAVE_DATA_MAPPING = 'SAVE_DATA_MAPPING';
const DELETE_DATA_MAPPING = 'DELETE_DATA_MAPPING';

const INITIAL_STATE = {
  consortiumDataMappings: [],
};

export const saveDataMapping = applyAsyncLoading(
  (consortiumId, pipelineId, mappings, dataFile) => async (dispatch) => {
    const map = {
      consortiumId,
      pipelineId,
      dataType: dataFile.dataType,
      dataMappings: mappings,
      data: [{
        allFiles: dataFile.files,
        filesData: [],
      }],
    };

    const mappedColumns = [];

    if (dataFile.dataType === 'array') {
      map.data[0].baseDirectory = dirname(dataFile.metaFilePath);
      map.data[0].metaFilePath = dataFile.metaFilePath;

      Object.keys(mappings[0]).forEach((fieldsetName) => {
        mappings[0][fieldsetName].forEach((field) => {
          const mappedColumn = {
            name: field.dataFileFieldName,
            index: dataFile.metaFile[0].findIndex(c => c === field.dataFileFieldName),
          };

          mappedColumns.push(mappedColumn);
        });
      });

      dataFile.metaFile.forEach((dataRow, index) => {
        // first row is the header
        if (index === 0) {
          return;
        }

        const parsedRow = {};

        mappedColumns.forEach((mappedColumn) => {
          parsedRow[mappedColumn.name] = dataRow[mappedColumn.index];
        });

        map.data[0].filesData.push(parsedRow);
      });
    }


    await localDB.maps.put(map);
    dispatch(({
      type: SAVE_DATA_MAPPING,
      payload: map,
    }));
  }
);

export const deleteDataMapping = applyAsyncLoading(
  (consortiumId) => async (dispatch) => {
    dispatch(({
      type: DELETE_DATA_MAPPING,
      payload: consortiumId,
    }));
  }
);

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SAVE_DATA_MAPPING:
      const saveMapsCopy = [...state.consortiumDataMappings];
      const saveMapIndex = state.consortiumDataMappings.findIndex(map => map.consortiumId === action.payload.consortiumId);

      if (saveMapIndex === -1) {
        saveMapsCopy.push(action.payload);
      } else {
        saveMapsCopy.splice(saveMapIndex, 1, action.payload);
      }

      return {
        ...state,
        consortiumDataMappings: saveMapsCopy,
      };
    case DELETE_DATA_MAPPING:
      const deleteMapsCopy = [...state.consortiumDataMappings];
      const deleteIndex = state.consortiumDataMappings.findIndex(map => map.consortiumId === action.payload);

      if (deleteIndex > -1) {
        deleteMapsCopy.splice(deleteIndex, 1);
      }

      return {
        ...state,
        consortiumDataMappings: deleteMapsCopy,
      }
    default:
      return state;
  }
}
