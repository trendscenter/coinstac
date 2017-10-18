import { applyAsyncLoading } from './loading';
import localDB from '../local-db';
import testData from '../../../../test/data/test-collection';

// Actions
const SET_COLLECTIONS = 'GET_ALL_COLLECTIONS';
const INIT_TEST_DATA = 'INIT_TEST_DATA';

// Action Creators
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

export const initTestData = (() =>
  dispatch =>
    localDB.collections.put(testData, 'test-collection')
    .then(() => {
      dispatch(({
        type: INIT_TEST_DATA,
        payload: null,
      }));
    })
);

const INITIAL_STATE = {
  collections: [],
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case INIT_TEST_DATA:
      return { collections: [...state.collections, action.payload] };
    case SET_COLLECTIONS:
      return { collections: action.payload };
    default:
      return state;
  }
}
