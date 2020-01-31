import { dirname } from 'path';
import { applyAsyncLoading } from './loading';
import localDB from '../local-db';

const SAVE_DATA_MAPPING = 'SAVE_DATA_MAPPING';

const INITIAL_STATE = {
  consortiumDataMappings: [],
};

export const saveDataMapping = applyAsyncLoading(
  (consortiumId, pipelineId, mappings, dataFile) => async (dispatch) => {
    const map = {
      consortiumId,
      pipelineId,
      dataMappings: mappings,
      data: [{
        baseDirectory: dirname(dataFile.metaFilePath),
        metaFilePath: dataFile.metaFilePath,
        filesData: [],
      }],
    };

    const mappedColumns = [];

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

    await localDB.maps.put(map);
    dispatch(({
      type: SAVE_DATA_MAPPING,
      payload: map,
    }));
  }
);

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SAVE_DATA_MAPPING:
      const mapsCopy = [...state.consortiumDataMappings];
      const index = state.consortiumDataMappings.findIndex(map => map.consortiumId === action.payload.consortiumId);

      if (index === -1) {
        mapsCopy.push(action.payload);
      } else {
        mapsCopy.splice(index, 1, action.payload);
      }

      return {
        ...state,
        consortiumDataMappings: mapsCopy,
      };
    default:
      return state;
  }
}
