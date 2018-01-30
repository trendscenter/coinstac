import { applyAsyncLoading } from './loading';
import localDB from '../local-db';
import testData from '../../../../test/data/test-collection.json';

// Actions
const DELETE_ASSOCIATED_CONSORTIA = 'DELETE_ASSOCIATED_CONSORTIA';
const DELETE_COLLECTION = 'DELETE_COLLECTION';
const INIT_TEST_COLLECTION = 'INIT_TEST_COLLECTION';
const SAVE_ASSOCIATED_CONSORTIA = 'SAVE_ASSOCIATED_CONSORTIA';
const SAVE_COLLECTION = 'SAVE_COLLECTION';
const SET_ASSOCIATED_CONSORTIA = 'SET_ASSOCIATED_CONSORTIA';
const SET_COLLECTIONS = 'GET_ALL_COLLECTIONS';

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

export const getAssociatedConsortia = applyAsyncLoading(consortiaIds =>
  dispatch =>
    localDB.associatedConsortia.filter(cons => consortiaIds.indexOf(cons.id) > -1)
      .toArray()
      .then((consortia) => {
        dispatch(({
          type: SET_ASSOCIATED_CONSORTIA,
          payload: consortia,
        }));
      })
);

export const initTestData = (() =>
  dispatch =>
    localDB.collections.put(testData)
    .then(() => {
      dispatch(({
        type: INIT_TEST_COLLECTION,
        payload: null,
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
  collections: [],
  associatedConsortia: [],
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
    case SET_ASSOCIATED_CONSORTIA:
      return { ...state, associatedConsortia: action.payload };
    case INIT_TEST_COLLECTION:
    default:
      return state;
  }
}
