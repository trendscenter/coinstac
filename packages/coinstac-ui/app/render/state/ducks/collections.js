import { applyAsyncLoading } from './loading';
import localDB from '../local-db';
import testData from '../../../../test/data/test-collection.json';

// Actions
const DELETE_ASSOCIATED_CONSORTIA = 'DELETE_ASSOCIATED_CONSORTIA';
const DELETE_COLLECTION = 'DELETE_COLLECTION';
const GET_COLLECTION_FILES = 'GET_COLLECTION_FILES';
const INIT_TEST_COLLECTION = 'INIT_TEST_COLLECTION';
const SAVE_ASSOCIATED_CONSORTIA = 'SAVE_ASSOCIATED_CONSORTIA';
const SAVE_COLLECTION = 'SAVE_COLLECTION';
const GET_ASSOCIATED_CONSORTIA = 'GET_ASSOCIATED_CONSORTIA';
const REMOVE_COLLECTIONS_FROM_CONS = 'REMOVE_COLLECTIONS_FROM_CONS';
const SET_COLLECTIONS = 'GET_ALL_COLLECTIONS';

function iteratePipelineSteps(consortium, filesByGroup) {
  let mappingIncomplete = false;
  const collections = [];
  const steps = [];

  /* Get step covariates and compare against local file mapping to ensure mapping is complete
      Add local files groups to array in order to grab files to pass to pipeline */
  for (let sIndex = 0; sIndex < consortium.pipelineSteps.length; sIndex += 1) {
    const step = consortium.pipelineSteps[sIndex];

    // Look through covariates
    const covariates = [];
    for (let cIndex = 0; cIndex < step.inputMap.covariates.length; cIndex += 1) {
      const covar = step.inputMap.covariates[cIndex];
      if (covar.source.inputKey === 'file'
          && consortium.stepIO[sIndex] && consortium.stepIO[sIndex][cIndex]
          && consortium.stepIO[sIndex][cIndex].collectionId) {
        const { groupId, collectionId } = consortium.stepIO[sIndex][cIndex];
        collections.push({ groupId, collectionId });
      } else if (covar.source.inputKey === 'file'
          && (!consortium.stepIO[sIndex] || !consortium.stepIO[sIndex][cIndex]
          || !consortium.stepIO[sIndex][cIndex].collectionId)) {
        mappingIncomplete = true;
        break;
      } else if (filesByGroup) {
        covariates.push(consortium.stepIO[sIndex][cIndex]);
      }
    }

    // Look through data
    const data = [];
    for (let dIndex = 0; dIndex < step.inputMap.data.length; dIndex += 1) {
      const datum = step.inputMap.data[dIndex];
      if (datum.source.inputKey === 'file'
          && consortium.stepIO[sIndex] && consortium.stepIO[sIndex][dIndex]
          && consortium.stepIO[sIndex][dIndex].collectionId) {
        const { groupId, collectionId } = consortium.stepIO[sIndex][dIndex];
        collections.push({ groupId, collectionId });
      } else if (datum.source.inputKey === 'file'
          && (!consortium.stepIO[sIndex] || !consortium.stepIO[sIndex][dIndex]
          || !consortium.stepIO[sIndex][dIndex].collectionId)) {
        mappingIncomplete = true;
        break;
      } else if (filesByGroup) {
        data.push(consortium.stepIO[sIndex][dIndex]);
      }
    }

    if (mappingIncomplete) {
      break;
    }
  }


  if (mappingIncomplete) {
    return {
      error: `Mapping incomplete for new run from ${consortium.name}. Please complete variable mapping before continuing.`,
    };
  }

  return { collections, steps };
}

// Action Creators
export const deleteAssociatedConsortia = applyAsyncLoading(consId =>
  dispatch =>
    localDB.associatedConsortia
      .delete(consId)
      .then(() => {
        dispatch(({
          type: DELETE_ASSOCIATED_CONSORTIA,
          payload: consId,
        }));
      })
  );

export const deleteCollection = applyAsyncLoading(collectionId =>
  dispatch =>
    localDB.collections
      .delete(collectionId)
      .then(() => {
        dispatch(({
          type: DELETE_COLLECTION,
          payload: collectionId,
        }));
      })
  );

export const getAllCollections = applyAsyncLoading(() =>
  dispatch =>
    localDB.collections
      .toArray()
      .then((collections) => {
        dispatch(({
          type: SET_COLLECTIONS,
          payload: collections,
        }));
      })
);

export const getCollectionFiles = applyAsyncLoading((consortiumId, consortiumName, steps) =>
  (dispatch) => {
    let needsFiles = false;

    // TODO: Revisit when its decided if client may be in charge of
    //   supplying values to non-covariate vars
    for (let i = 0; i < steps.length; i += 1) {
      if ('covariates' in steps[i].inputMap) {
        for (let q = 0; q < steps[i].inputMap.covariates.length; q += 1) {
          if (steps[i].inputMap.covariates[q].source.inputKey === 'file') {
            needsFiles = true;
            break;
          }
        }
      }
      if (needsFiles) {
        break;
      }
    }

    // Doesn't need local file paths, so return an empty array
    if (!needsFiles) {
      return [];
    }

    return localDB.associatedConsortia.get(consortiumId)
    .then((consortium) => {
      if (!consortium) {
        const error = {
          error: `No associated consortia in local db. Please visit Collections and map variables for ${consortiumName}.`,
        };
        dispatch(({
          type: GET_COLLECTION_FILES,
          payload: error,
        }));
        return error;
      }

      const collections = iteratePipelineSteps(consortium);

      if ('error' in collections) {
        dispatch(({
          type: GET_COLLECTION_FILES,
          payload: collections.error,
        }));
        return collections.error;
      }

      return localDB.collections
        .filter(collection => collections.findIndex(c => c.collectionId === collection.id) > -1)
        .toArray()
        .then((localDBCols) => {
          let allFiles = [];
          const filesByGroup = {};

          localDBCols.forEach((coll) => {
            Object.values(coll.fileGroups).forEach((group) => {
              allFiles = allFiles.concat(coll.fileGroups[group.id].files);
              filesByGroup[group.id] = coll.fileGroups[group.id].files;
            });
          });

          dispatch(({
            type: GET_COLLECTION_FILES,
            payload: { allFiles, filesByGroup },
          }));
          return { allFiles, filesByGroup };
        });
    });
  }
);

export const getAssociatedConsortia = applyAsyncLoading(consortiaIds =>
  dispatch =>
    localDB.associatedConsortia
      .filter(cons => consortiaIds.indexOf(cons.id) > -1)
      .toArray()
      .then((consortia) => {
        dispatch(({
          type: GET_ASSOCIATED_CONSORTIA,
          payload: consortia,
        }));
      })
);

export const initTestData = (() =>
  dispatch =>
    localDB.associatedConsortia.clear()
    .then(() => localDB.collections.put(testData))
    .then(() => {
      dispatch(({
        type: INIT_TEST_COLLECTION,
        payload: null,
      }));
    })
);

export const removeCollectionsFromAssociatedConsortia = applyAsyncLoading(consId =>
  dispatch =>
    localDB.associatedConsortia.get(consId)
      .then((consortium) => {
        if (!consortium || !consortium.stepIO) {
          return [];
        }

        const collectionIds = [];

        consortium.stepIO.forEach((step) => {
          step.forEach((obj) => {
            collectionIds.push(obj.collectionId);
          });
        });

        return collectionIds;
      })
      .then((collectionIds) => {
        if (collectionIds.length === 0) {
          return;
        }

        return Promise.all([
          localDB.collections
            .filter(col => collectionIds.indexOf(col.id) > -1)
            .modify((col) => {
              const index = col.associatedConsortia.indexOf(consId);
              col.associatedConsortia.splice(index, 1);
            }),
          localDB.associatedConsortia.delete(consId),
        ]);
      })
      .then(() => {
        return localDB.collections
          .toArray();
      })
      .then((collections) => {
        dispatch(({
          type: REMOVE_COLLECTIONS_FROM_CONS,
          payload: { collections, consId },
        }));
      })
  );

export const saveCollection = applyAsyncLoading(collection =>
  dispatch =>
    localDB.collections.put(collection)
      .then(() => {
        dispatch(({
          type: SAVE_COLLECTION,
          payload: collection,
        }));
      })
);

export const saveAssociatedConsortia = applyAsyncLoading(cons =>
  dispatch =>
    localDB.associatedConsortia.put(cons)
      .then(() => {
        dispatch(({
          type: SAVE_ASSOCIATED_CONSORTIA,
          payload: cons,
        }));
      })
);

const INITIAL_STATE = {
  associatedConsortia: [],
  collections: [],
  runFiles: [],
  runFilesByGroup: {},
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
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
    case GET_COLLECTION_FILES:
      return {
        ...state,
        runFiles: [...action.payload.allFiles],
        runFilesByGroup: { ...action.payload.filesByGroup },
      };
    case SAVE_ASSOCIATED_CONSORTIA: {
      const newCons = [...state.associatedConsortia];
      const index = state.associatedConsortia.findIndex(cons => cons.id === action.payload.id);

      if (index === -1) {
        newCons.push(action.payload);
      } else {
        newCons.splice(index, 1, action.payload);
      }

      return { ...state, associatedConsortia: newCons };
    }
    case REMOVE_COLLECTIONS_FROM_CONS: {
      const newCons = [...state.associatedConsortia];
      const index = state.associatedConsortia.findIndex(cons => cons.id === action.payload.consId);
      newCons.splice(index, 1);

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
    case GET_ASSOCIATED_CONSORTIA:
      return { ...state, associatedConsortia: action.payload };
    case INIT_TEST_COLLECTION:
    default:
      return state;
  }
}
