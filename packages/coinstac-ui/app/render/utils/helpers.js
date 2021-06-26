import {
  get, indexOf, setWith, take, values,
} from 'lodash';
import fs from 'fs';
import CsvReadableStream from 'csv-reader';

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
      if (!step.inputMap[inputSchemaKey].fulfilled) {
        needsDataMapping = true;
      }
    });
  });

  return needsDataMapping;
}

export function reducePipelineInputs(pipeline) {
  if (!pipeline || !pipeline.steps) {
    return [];
  }

  const reducedInputs = pipeline.steps.reduce((inputs, step) => {
    const inputsArray = [...inputs];

    Object.keys(step.inputMap).forEach((inputMapKey) => {
      if (step.inputMap[inputMapKey].fulfilled) {
        return;
      }

      if (Array.isArray(step.inputMap[inputMapKey].value)) {
        inputsArray.push(...step.inputMap[inputMapKey].value);
      } else {
        inputsArray.push(step.inputMap[inputMapKey].value);
      }
    });

    return inputsArray;
  }, []);

  return reducedInputs;
}

export const isAdmin = (user) => {
  return get(user, 'permissions.roles.admin', false);
};

export const isAuthor = (user) => {
  return get(user, 'permissions.roles.author', false);
};

export const isAllowedForComputationChange = (user) => {
  return isAdmin(user) || isAuthor(user);
};

export const getGraphQLErrorMessage = (error, defaultMessag) => {
  return get(error, 'graphQLErrors.0.message', defaultMessag);
};

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

export const buildTree = (nodes) => {
  const res = {};

  nodes.forEach((node) => {
    const segments = node.split('/');

    for (let segIndex = 0; segIndex < segments.length; segIndex += 1) {
      const parents = take(segments, segIndex);

      const currentSegment = segments[segIndex];

      if (segIndex === 0) {
        if (!res[currentSegment]) {
          res[currentSegment] = {
            id: currentSegment,
            name: currentSegment,
            children: {},
          };
        }
      } else {
        const path = `${parents.join('.children.')}.children`;
        const currentPath = [...path.split('.'), currentSegment];

        if (!get(res, currentPath)) {
          setWith(res, currentPath, {
            id: currentSegment,
            name: currentSegment,
            children: {},
          }, Object);
        }
      }
    }
  });

  const output = values(res);

  return output;
};

export const generateInitalFileTree = (consortia, runs) => {
  return consortia.map((consortium) => {
    const consortiumRuns = runs.filter(
      run => run.consortiumId === consortium.id && !!run.endDate
    ).map(run => ({
      id: run.id, pipelineName: run.pipelineSnapshot.name, endDate: Number(run.endDate),
    }));

    return {
      id: consortium.id,
      name: consortium.name,
      runs: consortiumRuns,
    };
  });
};
