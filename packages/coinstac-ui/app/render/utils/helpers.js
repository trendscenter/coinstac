import {
  get, indexOf, setWith, take, values, keys,
} from 'lodash';
import fs from 'fs';
import CsvReadableStream from 'csv-reader';
import { v4 as uuidv4 } from 'uuid'; // eslint-disable-line

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

export const isOwnerOfAnyHeadlessClient = (user) => {
  return Object.keys(get(user, 'permissions.headlessClients', {})).length > 0;
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
  console.log({ message: 'in helpers.js in readCsvFreesurferFiles', files });
  const readPromises = files.map(file => new Promise((resolve, reject) => {
    window.myStreams = [];
    try {
      console.log({ message: 'in helpers.js in readCsvFreesurferFiles in the try block', file });
      const inputStream = fs.createReadStream(file, 'utf8');
      window.myStreams.push(inputStream);

      const data = {};
      let header = [];

      inputStream
        .on('open', (msg) => {
          console.log({ message: 'inputStream is open', msg });
        })
        .on('ready', (msg) => {
          console.log({ message: 'inputStream is ready', msg });
        })
        .on('close', (msg) => {
          console.log({ message: 'inputStream is close', msg });
        })
        .on('data', (msg) => {
          console.log({ message: 'inputStream is data', msg });
        })
        .on('error', (msg) => {
          console.log({ message: 'inputStream is error', msg });
        });

      const myCsvReadableStream = new CsvReadableStream({
        parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true,
      });

      inputStream.pipe(myCsvReadableStream);

      myCsvReadableStream
        .on('data', (row) => {
          console.log({ message: 'stream2 on data' });
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
        .on('header', (headerRow) => {
          console.log({ message: 'stream2 on header' });
          header = headerRow;
        })

        .on('end', () => {
          console.log({ message: 'stream2 on end' });
          // Remove the first column from the header as it's just an id and does not need to
          // be shown to the user
          header = header.filter((col, i) => i !== 0);
          resolve({ header, data });
        })

        .on('close', () => {
          console.log({ message: 'stream2 on close' });
          header = header.filter((col, i) => i !== 0);
          resolve({ header, data });
        })

        .on('finish', () => {
          console.log({ message: 'stream2 on finish' });
          header = header.filter((col, i) => i !== 0);
          resolve({ header, data });
        })

        .on('error', (e) => {
          console.log({ message: 'stream2 on error' });
          reject(e);
        })

        .on('drain', (e) => {
          console.log({ message: 'stream2 on drain' });
          reject(e);
        })

        .on('pipe', (e) => {
          console.log({ message: 'stream2 on pipe' });
          reject(e);
        })

        .on('readable', () => {
          console.log({ message: 'stream2 on readable' });
        })

        .on('pause', () => {
          console.log({ message: 'stream2 on pause' });
        });


      console.log({ message: 'after inputStream initialized', inputStream });
    } catch (error) {
      console.log({ error });
      reject(error);
    }
  }));

  return Promise.all(readPromises);
  // return [{ header: ['header1', 'header2'], data: ['data1', 'data2'] }];
}

export const buildTree = (nodes) => {
  const trees = {};

  nodes.forEach((node) => {
    const segments = node.split('/');

    for (let segIndex = 0; segIndex < segments.length; segIndex += 1) {
      const parents = take(segments, segIndex);

      const currentSegment = segments[segIndex];

      if (segIndex === 0) {
        if (!trees[currentSegment]) {
          trees[currentSegment] = {
            id: currentSegment,
            name: currentSegment,
            children: {},
          };
        }
      } else {
        const path = `${parents.join('.children.')}.children`;
        const currentPath = [...path.split('.'), currentSegment];

        if (!get(trees, currentPath)) {
          setWith(trees, currentPath, {
            id: currentSegment,
            name: currentSegment,
            children: {},
          }, Object);
        }
      }
    }
  });


  const root = {
    id: 'root',
    name: 'root',
    children: trees,
  };

  const convertObjectToArray = (tree) => {
    if (!tree.children) {
      return {
        id: `${tree.id}-${uuidv4()}`,
        name: tree.name,
        children: [],
      };
    }

    if (Array.isArray(tree.children)) {
      if (keys(tree.children) === 0) {
        return {
          id: `${tree.id}-${uuidv4()}`,
          name: tree.name,
          children: [],
        };
      }
    }

    return {
      id: `${tree.id}-${uuidv4()}`,
      name: tree.name,
      children: values(tree.children).map(elem => convertObjectToArray(elem)),
    };
  };

  const res = convertObjectToArray(root);

  return res;
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
