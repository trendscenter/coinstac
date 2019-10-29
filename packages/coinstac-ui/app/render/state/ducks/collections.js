import { isEqual } from 'lodash';
import {
  dirname, resolve, extname, sep,
} from 'path';
import { applyAsyncLoading } from './loading';
import localDB from '../local-db';
import inputDataTypes from '../input-data-types.json';

// Actions
const CLEAR_COLLECTIONS_CONSORTIA = 'CLEAR_COLLECTIONS_CONSORTIA';
const DELETE_ASSOCIATED_CONSORTIA = 'DELETE_ASSOCIATED_CONSORTIA';
const DELETE_COLLECTION = 'DELETE_COLLECTION';
const GET_COLLECTION_FILES = 'GET_COLLECTION_FILES';
const INIT_TEST_COLLECTION = 'INIT_TEST_COLLECTION';
const SAVE_ASSOCIATED_CONSORTIA = 'SAVE_ASSOCIATED_CONSORTIA';
const SAVE_COLLECTION = 'SAVE_COLLECTION';
const GET_CONSORTIUM = 'GET_CONSORTIUM';
const GET_ASSOCIATED_CONSORTIA = 'GET_ASSOCIATED_CONSORTIA';
const REMOVE_COLLECTIONS_FROM_CONS = 'REMOVE_COLLECTIONS_FROM_CONS';
const SET_COLLECTIONS = 'GET_ALL_COLLECTIONS';
const UNMAP_ASSOCIATED_CONSORTIA = 'UNMAP_ASSOCIATED_CONSORTIA';

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

  const escape = (string) => {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // eslint-disable-line no-useless-escape
  };
  const pathsep = new RegExp(`${escape(sep)}|:`, 'g');
  parsedRows = parsedRows.map((path) => {
    if (extname(path[0]) !== '') {
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

function parseFileData(dataRows, inputSchema, mappedStepData, baseDirectory, keyArray) {
  // Get typed indices from header (first row)
  const indices = [];
  dataRows[0].forEach((col, colIndex) => {
    for (let i = 0; i < inputSchema.ownerMappings.length; i += 1) {
      // TODO: using use entered names as keys or equality for the raw columns in the
      // csv is a bad idea, fix this and clean up this whole function
      const ownerMapping = inputSchema.ownerMappings[i];
      if (col.toLowerCase().includes(
        ownerMapping.name.toLowerCase()
      )) {
        indices.push({
          index: colIndex,
          type: ownerMapping.type,
        });
        break;
      }
    }
  });

  // Cast types to row col indices
  dataRows.forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      return;
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
  });

  const escape = (string) => {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // eslint-disable-line no-useless-escape
  };
  const pathsep = new RegExp(`${escape(sep)}|:`, 'g');
  dataRows = dataRows.map((path) => {
    if (extname(path[0]) !== '') {
      path[0] = resolve(baseDirectory, path[0]).replace(pathsep, '-');
      return path;
    }
    return path;
  });

  keyArray[0].push(dataRows);
  keyArray[1] = mappedStepData.map(val => val.column);

  if (inputSchema.ownerMappings.every(val => !(val.type === undefined))) {
    keyArray[2] = inputSchema.ownerMappings.map(val => val.type);
  }
}

function stepInputNeedsDataMapping(inputSchema) {
  return 'ownerMappings' in inputSchema;
}

function stepInputMapSchemaHasOptions(inputMapSchemaKeys) {
  return inputMapSchemaKeys.includes('data') && inputMapSchemaKeys.findIndex(element => element.includes('options'))
    && !inputMapSchemaKeys.includes('covariates') && !inputMapSchemaKeys.includes('file');
}

function inputSchemaHasFileSource(inputSchemaObj) {
  return inputSchemaObj.source === 'file';
}

function getMappedDataCollectionIds(consortium) {
  const collectionIds = new Set();

  consortium.pipelineSteps.forEach((step, stepIndex) => {
    const consortiumMappedStepData = consortium.stepIO[stepIndex];

    if (!consortiumMappedStepData) {
      throw new Error('Data was not mapped for at least one of the computation steps');
    }

    const inputMapSchema = { ...step.inputMap };
    const inputMapSchemaKeys = Object.keys(inputMapSchema);

    inputMapSchemaKeys.forEach((inputSchemaKey) => {
      const inputSchema = step.inputMap[inputSchemaKey];

      if (!stepInputNeedsDataMapping(inputSchema)) {
        return;
      }

      const firstInputSchemaObj = inputSchema.ownerMappings[0];
      const inputKeyData = consortiumMappedStepData[inputSchemaKey][0];

      if (stepInputMapSchemaHasOptions(inputMapSchemaKeys)) {
        if (!inputKeyData || !inputKeyData.groupId || !inputKeyData.collectionId) {
          throw new Error('Data mapping is incomplete');
        }

        collectionIds.add(inputKeyData.collectionId);
      } else if (inputSchemaHasFileSource(firstInputSchemaObj)) {
        if (!inputKeyData || !inputKeyData.column || !inputKeyData.collectionId) {
          throw new Error('Data mapping is incomplete');
        }

        collectionIds.add(inputKeyData.collectionId);
      }
    });
  });

  return [...collectionIds];
}

function buildConsortiumStepsData(consortium, filesByGroup, baseDirectory) {
  const steps = [];

  consortium.pipelineSteps.forEach((step, stepIndex) => {
    const consortiumMappedStepData = consortium.stepIO[stepIndex];

    if (!consortiumMappedStepData) {
      throw new Error('Data was not mapped for at least one of the computation steps');
    }

    const inputMapSchema = { ...step.inputMap };
    const inputMapSchemaKeys = Object.keys(inputMapSchema);

    inputMapSchemaKeys.forEach((inputSchemaKey) => {
      const inputSchema = step.inputMap[inputSchemaKey];

      if (!stepInputNeedsDataMapping(inputSchema)) {
        return;
      }

      let keyArray = [[], [], []]; // [[values], [labels], [type (if present)]]
      const firstInputSchemaObj = inputSchema.ownerMappings[0];
      const inputKeyData = consortiumMappedStepData[inputSchemaKey][0];

      if (stepInputMapSchemaHasOptions(inputMapSchemaKeys)) {
        if (!inputKeyData || !inputKeyData.groupId || !inputKeyData.collectionId) {
          throw new Error('Data mapping is incomplete');
        }

        if (filesByGroup && baseDirectory) {
          const escape = (string) => {
            return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // eslint-disable-line no-useless-escape
          };
          const pathsep = new RegExp(`${escape(sep)}|:`, 'g');
          const pathsArray = filesByGroup[inputKeyData.groupId];
          let paths = pathsArray.map((path) => {
            if (path[0].includes('/')) {
              return path[0].replace(pathsep, '-');
            }
            return null;
          });
          paths = paths.filter(Boolean);
          keyArray.push(paths);
        }
      } else if (inputSchemaHasFileSource(firstInputSchemaObj)) {
        if (!inputKeyData || !inputKeyData.column || !inputKeyData.collectionId) {
          throw new Error('Data mapping is incomplete');
        }

        if (filesByGroup) {
          parseFileData(
            filesByGroup[inputKeyData.groupId],
            inputSchema,
            consortiumMappedStepData[inputSchemaKey],
            baseDirectory,
            keyArray
          );
        }
      } else if (filesByGroup) {
        if (!inputDataTypes.includes(firstInputSchemaObj.type) || !inputKeyData
          || !inputKeyData.column || !inputKeyData.groupId) {
          throw new Error('Data mapping is incomplete');
        }

        let filepaths = filesByGroup[inputKeyData.groupId];
        if (filepaths) {
          filepaths = filepaths.map(path => (extname(path[0]) !== '' ? path[0] : undefined))
            .filter(Boolean);
        }

        // There will only ever be one single data object. Don't nest arrays, use concat.
        keyArray[0] = keyArray[0].concat(filepaths);
        keyArray[1].push(firstInputSchemaObj.type);
        if ('value' in firstInputSchemaObj) {
          keyArray[2] = keyArray[2].concat(firstInputSchemaObj.value);
        }
      }

      // remove empty array items if present
      keyArray = keyArray.filter((item) => {
        return item.length !== 0;
      });

      if (keyArray.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        inputMapSchema[inputSchemaKey].value = keyArray[0];
      } else {
        inputMapSchema[inputSchemaKey] = { value: keyArray };
      }
    });

    steps.push({ ...step, inputMapSchema });
  });
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

    /*
      inputMap
      {
        covariates: {
          ownerMappings: [
            { name: "isControl", source: "file", type: "boolean" },
            { name: "age", source: "file", type: "number" }
          ]
        },
        data: {
          ownerMappings: [
            { type: "FreeSurfer", value: [ "3rd-Ventricle" ] }
          ]
        },
        lambda: {
          value: 0
        }
      }

      stepIO
      [
        {
          covariates: [
            { collectionId: 1, groupId: "kgEZ9q3s", column: "isControl" },
            { collectionId: 1, groupId: "kgEZ9q3s", column: "age" }
          ],
          data: [
            { collectionId: 1, groupId: "kgEZ9q3s", column: "FreeSurfer" }
          ]
        }
      ]
    */

    for (let keyIndex = 0; keyIndex < inputKeys.length; keyIndex += 1) {
      const key = inputKeys[keyIndex];

      if ('ownerMappings' in step.inputMap[key]) {
        let keyArray = [[], [], []]; // [[values], [labels], [type (if present)]]
        const mappingIndex = 0;
        const mappingObj = step.inputMap[key].ownerMappings[mappingIndex];
        if (inputKeys.includes('data')
        && inputKeys.findIndex(element => element.includes('options'))
        && !inputKeys.includes('covariates')
        && !inputKeys.includes('file')) {
          let groupId = false;
          let collectionId = false;
          let ownerId = false;
          if(consortium.stepIO[sIndex]) {
            let conStepIO = consortium.stepIO[sIndex][key][mappingIndex];
            groupId = conStepIO.groupId;
            collectionId = conStepIO.collectionId;
            ownerId = consortium.owners[0];
          }
          if (filesByGroup && baseDirectory) {
            const e = new RegExp(); // eslint-disable-line no-useless-escape
            const escape = (string) => {
              return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // eslint-disable-line no-useless-escape
            };
            const pathsep = new RegExp(`${escape(sep)}|:`, 'g');
            const pathsArray = filesByGroup[groupId];
            let paths = pathsArray.map((path) => {
              if (path[0].includes('/')) {
                let filepath = path[0];
                filepath = filepath.replace(pathsep, '-');
                //path = "/input/"+ownerId+"/"+runId+"/"+path;
                return filepath;
              }
            });
            paths = paths.filter(Boolean);
            keyArray.push(paths);
          } else {
            if (groupId && collectionId && consortium.pipelineSteps) {
              let pipelineSteps = consortium.pipelineSteps[0];
              collections.push({ groupId, collectionId });
            } else {
              mappingIncomplete = true;
              break;
            }
          }
        }else if (mappingObj.source === 'file'
        && consortium.stepIO[sIndex] && consortium.stepIO[sIndex][key][mappingIndex]
        && consortium.stepIO[sIndex][key][mappingIndex].collectionId
        && consortium.stepIO[sIndex][key][mappingIndex].column) {
          const { groupId, collectionId } = consortium.stepIO[sIndex][key][mappingIndex];
          collections.push({ groupId, collectionId });
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
          || !consortium.stepIO[sIndex][key][mappingIndex].collectionId
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

        keyArray = keyArray.filter((item) => {
          return item.length !== 0;
        });// remove empty array items if present

        if(keyArray.length === 1){
          inputMap[key].value = keyArray[0];
        }else{
          inputMap[key] = { value: keyArray };
        }

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

// Action Creators
export const deleteAssociatedConsortia = applyAsyncLoading(
  consId => dispatch => localDB.associatedConsortia
    .delete(consId)
    .then(() => {
      dispatch(({
        type: DELETE_ASSOCIATED_CONSORTIA,
        payload: consId,
      }));
    })
);

export const deleteCollection = applyAsyncLoading(collectionId => dispatch => localDB.collections
  .delete(collectionId)
  .then(() => {
    dispatch(({
      type: DELETE_COLLECTION,
      payload: collectionId,
    }));
  }));

export const getAllCollections = applyAsyncLoading(() => dispatch => localDB.collections
  .toArray()
  .then((collections) => {
    dispatch(({
      type: SET_COLLECTIONS,
      payload: collections,
    }));
  }));

export const mapConsortiumData = async (consortiumId) => {
  const consortium = await localDB.associatedConsortia.get(consortiumId);

  if (!consortium) {
    return;
  }

  const collectionIds = getMappedDataCollectionIds(consortium);

  await localDB.associatedConsortia.update(consortium.id, { isMapped: true });

  const collections = await localDB.collections
    .filter(collection => collectionIds.includes(collection.id))
    .toArray();

  let allFiles = [];
  const filesByGroup = {};
  let metaDir;
  collections.forEach((coll) => {
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

  const steps = buildConsortiumStepsData(consortium, filesByGroup, metaDir);

  return { allFiles, steps };
};

export const getCollectionFiles = (consortiumId, runId) => (dispatch) => {
  return localDB.associatedConsortia.get(consortiumId)
    .then((consortium) => {
      let collections = { collections: [] };
      if (consortium && consortium.pipelineSteps) {
        collections = iteratePipelineSteps(consortium);
      } else {
        // no local collection assocaiated with the input consortia
        console.log('Missing consortia in local collection');
        return;
      }

      /*
        collections
        {
          collections: [
            { groupId: "J7JZwAZB", collectionId: 1 }
          ],
          steps: [
            { id: "GEQm9xZK", computations: Array(1), controller: {…}, inputMap: {…}, __typename: "PipelineStep" }
          ]
        }
      */

      if ('error' in collections) {
        return localDB.associatedConsortia.update(consortium.id, { isMapped: false })
          .then(() => {
            dispatch(({
              type: GET_COLLECTION_FILES,
              payload: collections,
            }));
            return collections;
          });
      }

      return localDB.associatedConsortia.update(consortium.id, { isMapped: true })
        .then(() => {
          if (collections.collections.length === 0) {
            return { allFiles: collections.collections };
          }
          return localDB.collections
            .filter(collection => collections.collections.findIndex(
              c => c.collectionId === collection.id
            ) > -1)
            .toArray()
            .then((localDBCols) => {
              let allFiles = [];
              const filesByGroup = {};
              let metaDir;
              localDBCols.forEach((coll) => {
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

              /*
                filesByGroup
                {
                  aaaaa: [
                    ["id", "isControl", "age"],
                    ["-home-rochaeb-Documents-Projects-coinstac-algorith…reesurfer-test-data-site1-subject0_aseg_stats.txt", false, 22],
                    ...
                  ]
                }
              */

              // TODO: Reconsider how to get updated steps
              const { steps } = iteratePipelineSteps(consortium, filesByGroup, metaDir, runId);
              dispatch(({
                type: GET_COLLECTION_FILES,
                payload: { allFiles, steps },
              }));
              return { allFiles, steps };
            });
        });
    });
};


export const getAllAssociatedConsortia = applyAsyncLoading(
  () => dispatch => localDB.associatedConsortia
    .toArray()
    .then((consortia) => {
      dispatch(({
        type: GET_ASSOCIATED_CONSORTIA,
        payload: consortia,
      }));
    })
);

export const getAssociatedConsortia = applyAsyncLoading(
  consortiaIds => dispatch => localDB.associatedConsortia
    .filter(cons => consortiaIds.indexOf(cons.id) > -1)
    .toArray()
    .then((consortia) => {
      dispatch(({
        type: GET_ASSOCIATED_CONSORTIA,
        payload: consortia,
      }));

      return consortia;
    })
);

export const getConsortium = applyAsyncLoading(consortiumId =>
  dispatch =>
  localDB.associatedConsortia.get(consortiumId)
    .then((consortium) => {
      dispatch(({
        type: GET_CONSORTIUM,
        payload: consortium,
      }));

      return consortium;
    })
);

export const isAssocConsortiumMapped = applyAsyncLoading(consId =>
  () =>
  localDB.associatedConsortia.get(consId)
  .then(cons => cons.isMapped)
);

export const unmapAssociatedConsortia = applyAsyncLoading(consortia =>
  (dispatch) => {
    const updatePromises = [];
    const consortiaChanged = [];
    // if (consId) {
    //   consortia.forEach((consId) => {
    //     consortiaChanged.push(consId);
    //     updatePromises.push(
    //       localDB.associatedConsortia.update(consId, { stepIO: [], isMapped: false })
    //     );
    //   });
    // }
    return Promise.all(updatePromises)
    .then(() =>
    localDB.associatedConsortia
    .toArray()
  )
  .then((allConsortia) => {
    dispatch(({
      type: UNMAP_ASSOCIATED_CONSORTIA,
      payload: { allConsortia, consortiaChanged },
    }));
  });

  return Promise.all(updatePromises)
    .then(() => localDB.associatedConsortia
      .toArray())
    .then((allConsortia) => {
      dispatch(({
        type: UNMAP_ASSOCIATED_CONSORTIA,
        payload: { allConsortia, consortiaChanged },
      }));
    });
});

export const removeCollectionsFromAssociatedConsortia = applyAsyncLoading(
  (consId, deleteCons, pipelineSteps, activePipelineId) => (dispatch) => {
    return localDB.associatedConsortia.get(consId)
      .then((consortium) => {
        return Promise.all([
          consortium,
          localDB.collections.toArray()
            .then((collections) => {
              const collectionIds = [];
              collections.forEach((col) => {
                if (col.associatedConsortia && col.associatedConsortia.indexOf(consId) > -1) {
                  collectionIds.push(col.id);
                }
              });
              return collectionIds;
            }),
        ]);
      })
      .then(([consortium, collectionIds]) => {
        return Promise.all([
          consortium,
          collectionIds.length > 0 ? localDB.collections
            .filter(col => collectionIds.indexOf(col.id) > -1)
            .modify((col) => {
              const index = col.associatedConsortia.indexOf(consId);
              col.associatedConsortia.splice(index, 1);
            })
            : null,
          deleteCons ? localDB.associatedConsortia.delete(consId)
            : localDB.associatedConsortia.update(consortium.id, {
              activePipelineId, isMapped: false, stepIO: [], pipelineSteps, runs: 0,
            }),
        ]);
      })
      .then(([consortium]) => Promise.all([
        consortium,
        deleteCons ? null : getCollectionFiles(consortium.id)(dispatch),
      ]))
      .then(() => Promise.all([
        localDB.collections.toArray(),
        localDB.associatedConsortia.toArray(),
      ]))
      .then(([collections, associatedConsortia]) => {
        const payload = { associatedConsortia, collections, consId };
        if (deleteCons) {
          payload.deleteCons = true;
        }

        dispatch(({
          type: REMOVE_COLLECTIONS_FROM_CONS,
          payload,
        }));
      });
  }
);

export const clearCollectionsAndConsortia = applyAsyncLoading(() => dispatch => Promise.all([
  localDB.associatedConsortia.clear(),
  localDB.collections.clear(),
])
  .then(() => {
    dispatch(({
      type: CLEAR_COLLECTIONS_CONSORTIA,
      payload: null,
    }));
  }));

export const saveCollection = applyAsyncLoading(
  collection => dispatch => localDB.collections.put(collection)
    .then(() => {
      dispatch(({
        type: SAVE_COLLECTION,
        payload: collection,
      }));
    })
);

export const saveAssociatedConsortia = applyAsyncLoading(cons => (dispatch) => {
  return localDB.associatedConsortia.put(cons)
    .then(() => {
      dispatch(({
        type: SAVE_ASSOCIATED_CONSORTIA,
        payload: cons,
      }));
    });
});

export const syncRemoteLocalConsortia = (remoteCons, pipelineSteps) => (dispatch) => {
  return localDB.associatedConsortia.get(remoteCons.id)
    .then((localCons) => {
      if (localCons
            && (localCons.activePipelineId !== remoteCons.activePipelineId)) {
        removeCollectionsFromAssociatedConsortia(
          remoteCons.id,
          false,
          pipelineSteps,
          remoteCons.activePipelineId
        )(dispatch);
      } else if (!localCons) {
        localDB.associatedConsortia.put(remoteCons);
      }
    });
};

export const syncRemoteLocalPipelines = remotePipeline => dispatch => localDB.associatedConsortia.where('activePipelineId').equals(remotePipeline.id).toArray()
  .then((localConsortia) => {
    if (localConsortia) {
      localConsortia.forEach((localCons) => {
        if (!isEqual(localCons.pipelineSteps, remotePipeline.steps)) {
          removeCollectionsFromAssociatedConsortia(
            localCons.id, false, remotePipeline.steps, remotePipeline.id
          )(dispatch);
        }
      });
    }
  });

export const incrementRunCount = consId => dispatch => localDB.associatedConsortia.get(consId)
  .then((cons) => {
    let runs = 1;

    if (cons.runs) {
      runs += cons.runs;
    }

    localDB.associatedConsortia.update(consId, { runs });
    dispatch(({
      type: SAVE_ASSOCIATED_CONSORTIA,
      payload: { ...cons, runs },
    }));
  });

const INITIAL_STATE = {
  activeAssociatedConsortia: [],
  associatedConsortia: [],
  collections: [],
  error: '',
  runFiles: [],
  runSteps: [],
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_COLLECTIONS_CONSORTIA:
      return INITIAL_STATE;
    case DELETE_ASSOCIATED_CONSORTIA: {
      const newCons = [...state.associatedConsortia];
      const index = state.associatedConsortia.findIndex(cons => cons.id === action.payload);
      newCons.splice(index, 1);

      return { ...state, associatedConsortia: newCons };
    }
    case DELETE_COLLECTION: {
      const newCollections = [...state.collections];
      const index = state.collections.findIndex(col => col.id === action.payload);
      newCollections.splice(index, 1);

      return { ...state, collections: newCollections };
    }
    case GET_ASSOCIATED_CONSORTIA:
      return {
        ...state,
        activeAssociatedConsortia: action.payload,
        associatedConsortia: action.payload,
      };
    case UNMAP_ASSOCIATED_CONSORTIA: {
      const activeAssociatedConsortia = [...state.activeAssociatedConsortia];
      activeAssociatedConsortia.map((aCons) => {
        for (let i = 0; i < action.payload.consortiaChanged.length; i += 1) {
          if (aCons.id === action.payload.consortiaChanged[i]) {
            aCons.stepIO = [];
            aCons.isMapped = false;
            break;
          }
        }

        return aCons;
      });

      return {
        ...state,
        activeAssociatedConsortia,
        associatedConsortia: action.payload.allConsortia,
      };
    }
    case GET_COLLECTION_FILES:
      if ('error' in action.payload) {
        return {
          ...state,
          error: action.payload.error,
        };
      }

      return {
        ...state,
        runFiles: [...action.payload.allFiles],
        runSteps: [...action.payload.steps],
      };
    case SAVE_ASSOCIATED_CONSORTIA: {
      const allCons = [...state.associatedConsortia];
      const allIndex = state.associatedConsortia.findIndex(cons => cons.id === action.payload.id);
      const activeCons = [...state.activeAssociatedConsortia];
      const activeIndex = state.activeAssociatedConsortia
        .findIndex(cons => cons.id === action.payload.id);

      if (allIndex === -1) {
        allCons.push(action.payload);
      } else {
        allCons.splice(allIndex, 1, action.payload);
      }

      if (activeIndex === -1) {
        activeCons.push(action.payload);
      } else {
        activeCons.splice(activeIndex, 1, action.payload);
      }

      return { ...state, activeAssociatedConsortia: activeCons, associatedConsortia: allCons };
    }
    case REMOVE_COLLECTIONS_FROM_CONS: {
      const newCons = [...action.payload.associatedConsortia];
      const index = newCons.findIndex(cons => cons.id === action.payload.consId);
      if (action.payload.deleteCons) {
        newCons.splice(index, 1);
      }

      return { ...state, collections: action.payload.collections, associatedConsortia: newCons };
    }
    case SAVE_COLLECTION: {
      const newCollections = [...state.collections];
      const index = state.collections.findIndex(col => col.id === action.payload.id);

      if (index === -1) {
        newCollections.push(action.payload);
      } else {
        newCollections.splice(index, 1, action.payload);
      }

      return { ...state, collections: newCollections };
    }
    case SET_COLLECTIONS:
      return { ...state, collections: action.payload };
    case INIT_TEST_COLLECTION:
    default:
      return state;
  }
}
