import { indexOf } from 'lodash';
import fs from 'fs';
import CsvReadableStream from 'csv-reader';

const COMP_INPUT_NEED_USER_DATA = [
  'csv',
  'freesurfer',
  'files',
];

export function isPipelineOwner(permissions, owningConsortium) {
  return indexOf(permissions.consortia[owningConsortium], 'owner') !== -1;
}

export function pipelineNeedsDataMapping(pipeline) {
  if (!pipeline || !pipeline.steps) {
    return false;
  }

  let needsDataMapping = false;

  pipeline.steps.forEach((step) => {
    const inputMapSchemaKeys = Object.keys(step.inputMap);

    inputMapSchemaKeys.forEach((inputSchemaKey) => {
      const compInputField = step.computations[0].computation.input[inputSchemaKey];
      const compInputFieldType = compInputField.type.toLowerCase();

      if (COMP_INPUT_NEED_USER_DATA.includes(compInputFieldType)) {
        needsDataMapping = true;
      }
    });
  });

  return needsDataMapping;
}

export const isUserInGroup = (userId, groupArr) => {
  return Array.isArray(groupArr)
    ? groupArr.findIndex(user => user === userId)
    : userId in groupArr;
};

/**
 * Read the csv with freesurfer data
 * @param {Csv files} files
 */
export function readCsvFreesurferFiles(files) {
  const readPromises = files.map(file => new Promise((resolve, reject) => {
    try {
      const inputStream = fs.createReadStream(file, 'utf8');

      const data = {};
      let header = [];

      inputStream
        .pipe(new CsvReadableStream({
          parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true,
        }))
        .on('header', (headerRow) => {
          header = headerRow;
        })
        .on('data', (row) => {
          const rowData = {};

          row.forEach((cell, i) => {
            if (i === 0) {
              return;
            }

            rowData[header[i]] = cell;
          });

          // First column of each row serves as the row id
          data[row[0]] = rowData;
        })
        .on('end', () => {
          // Remove the first column from the header as it's just an id and does not need to
          // be shown to the user
          header = header.filter((col, i) => i !== 0);

          resolve({ header, data });
        });
    } catch (error) {
      reject(error);
    }
  }));

  return Promise.all(readPromises);
}
