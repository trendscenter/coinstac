import {
  dirname, resolve, extname, sep,
} from 'path';
import {
  FETCH_ALL_CONSORTIA_QUERY,
  GET_ALL_COLLECTIONS,
} from './functions';
import inputDataTypes from '../input-data-types.json';

function parseFilesByGroup(
  consortium,
  baseDirectory,
  filesByGroup,
  key,
  keyArray,
  mappingIndex,
  sIndex,
  step
) {
  // Cast col types
  let parsedRows = filesByGroup[consortium.stepIO[sIndex][key][mappingIndex].groupId];
  // Get typed indices from header (first row)
  const indices = [];
  parsedRows[0].forEach((col, colIndex) => { // eslint-disable-line no-loop-func
    for (
      let mapIndex = 0;
      mapIndex < step.inputMap[key].ownerMappings.length;
      mapIndex += 1
    ) {
      // TODO: using use entered names as keys or equality for the raw columns in the
      // csv is a bad idea, fix this and clean up this whole function
      if (col.toLowerCase().includes(
        step.inputMap[key].ownerMappings[mapIndex].name.toLowerCase()
      )) {
        indices.push({
          index: colIndex,
          type: step.inputMap[key].ownerMappings[mapIndex].type,
        });
        break;
      }
    }
  });
  // Cast types to row col indices
  parsedRows.map((row, rowIndex) => {
    if (rowIndex === 0) {
      return row;
    }

    indices.forEach((col) => {
      if (typeof row[col.index] === 'string') {
        if (col.type === 'boolean' && row[col.index].toLowerCase() === 'true') {
          row[col.index] = true;
        } else if (col.type === 'boolean' && row[col.index].toLowerCase() === 'false') {
          row[col.index] = false;
        } else if (col.type === 'number') {
          row[col.index] = parseFloat(row[col.index]);
        }
      }
    });

    return row;
  });

  const e = new RegExp(/[-\/\\^$*+?.()|[\]{}]/g); // eslint-disable-line no-useless-escape
  const escape = (string) => {
    return string.replace(e, '\\$&');
  };
  const pathsep = new RegExp(`${escape(sep)}|:`, 'g');
  parsedRows = parsedRows.map((path) => {
    if (extname(path[0]) !== '' && !path[0].startsWith(baseDirectory.replace(pathsep, '-'))) {
      path[0] = resolve(baseDirectory, path[0]).replace(pathsep, '-');
      return path;
    }
    return path;
  });

  keyArray[0].push(parsedRows);
  keyArray[1] = consortium.stepIO[sIndex][key].map(val => val.column);

  if (step.inputMap[key].ownerMappings.every(val => !(val.type === undefined))) {
    keyArray[2] = step.inputMap[key].ownerMappings.map(val => val.type);
  }
}

function iteratePipelineSteps(consortium, filesByGroup, baseDirectory) {
  let mappingIncomplete = false;
  const collections = [];
  const steps = [];

  /* Get step covariates and compare against local file mapping to ensure mapping is complete
  Add local files groups to array in order to grab files to pass to pipeline */
  for (let sIndex = 0; sIndex < consortium.pipelineSteps.length; sIndex += 1) {
    const step = consortium.pipelineSteps[sIndex];
    const inputMap = { ...step.inputMap };

    const inputKeys = Object.keys(inputMap);

    for (let keyIndex = 0; keyIndex < inputKeys.length; keyIndex += 1) {
      const key = inputKeys[keyIndex];
      
      if ('ownerMappings' in step.inputMap[key]) {
        const keyArray = [[], [], []]; // [[values], [labels], [type (if present)]]
        const mappingIndex = 0;
        const mappingObj = step.inputMap[key].ownerMappings[mappingIndex];
        if (mappingObj.source === 'file'
        && consortium.stepIO[sIndex] && consortium.stepIO[sIndex][key][mappingIndex]
        && consortium.stepIO[sIndex][key][mappingIndex].associatedConsortia
        && consortium.stepIO[sIndex][key][mappingIndex].column) {
          const { groupId, associatedConsortia } = consortium.stepIO[sIndex][key][mappingIndex];
          collections.push({ groupId, associatedConsortia });
          // This changes by how the parser is reading in files - concat or push
          if (filesByGroup) {
            parseFilesByGroup(
              consortium,
              baseDirectory,
              filesByGroup,
              key,
              keyArray,
              mappingIndex,
              sIndex,
              step
            );
          }
        } else if (mappingObj.source === 'file'
          && (!consortium.stepIO[sIndex] || !consortium.stepIO[sIndex][key][mappingIndex]
          || !consortium.stepIO[sIndex][key][mappingIndex].associatedConsortia
          || !consortium.stepIO[sIndex][key][mappingIndex].column)) {
          mappingIncomplete = true;
          break;
        } else if (filesByGroup && inputDataTypes.indexOf(mappingObj.type) > -1
        && consortium.stepIO[sIndex][key][mappingIndex].groupId
        && consortium.stepIO[sIndex][key][mappingIndex].column) {
          let filepaths = filesByGroup[consortium.stepIO[sIndex][key][mappingIndex].groupId];
          if (filepaths) {
            filepaths = filepaths.map(path => (extname(path[0]) !== '' ? path[0] : undefined))
              .filter(elem => elem !== undefined);
          }

          // There will only ever be one single data object. Don't nest arrays, use concat.
          keyArray[0] = keyArray[0].concat(filepaths);
          keyArray[1].push(mappingObj.type);
          if ('value' in mappingObj) {
            keyArray[2] = keyArray[2].concat(mappingObj.value);
          }
        } else if (inputDataTypes.indexOf(mappingObj.type) > -1
        && (!consortium.stepIO[sIndex][key][mappingIndex].groupId
          || !consortium.stepIO[sIndex][key][mappingIndex].column)) {
          mappingIncomplete = true;
          break;
        } else if (filesByGroup) {
          // TODO: Handle keys fromCache if need be
        }

        inputMap[key] = { value: keyArray };
      }

      if (mappingIncomplete) {
        break;
      }
    }

    if (mappingIncomplete) {
      break;
    }
    steps.push({ ...step, inputMap });
  }


  if (mappingIncomplete) {
    return {
      error: `Mapping incomplete for new run from ${consortium.name}. Please complete variable mapping before continuing.`,
    };
  }

  return { collections, steps };
}

function getCollectionFiles2(cache, consortiumId, stepIO) {
  const { fetchAllConsortia } = cache.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });

  const consortium = fetchAllConsortia.find(c => c.id === consortiumId);

  if (stepIO && stepIO.length > 0) {
    consortium.stepIO = stepIO;
  }

  let returnData = { collections: [] };
  if (consortium.pipelineSteps) {
    returnData = iteratePipelineSteps(consortium);
  }

  if ('error' in returnData) {
    return returnData;
  }

  if (returnData.collections.length === 0) {
    return { allFiles: returnData.collections };
  }

  const { collections } = cache.readQuery({ query: GET_ALL_COLLECTIONS });

  const localCollections = collections.filter(collection => returnData.collections.findIndex(
      c => c.associatedConsortia === collection.associatedConsortium
    ) > -1);

  let allFiles = [];
  const filesByGroup = {};
  let metaDir;
  localCollections.forEach((coll) => {
    Object.values(coll.fileGroups).forEach((group) => {
      allFiles = allFiles.concat(coll.fileGroups[group.id].files);
      if ('metaFile' in group) {
        metaDir = dirname(group.metaFilePath);
        filesByGroup[group.id] = coll.fileGroups[group.id].metaFile;
      } else {
        filesByGroup[group.id] = coll.fileGroups[group.id].files;
      }
    });
  });

  const key = Object.keys(filesByGroup)[0];

  // TODO: Reconsider how to get updated steps
  const { steps } = iteratePipelineSteps(consortium, filesByGroup, metaDir);

  return { allFiles, steps };
}

export { getCollectionFiles2 };
