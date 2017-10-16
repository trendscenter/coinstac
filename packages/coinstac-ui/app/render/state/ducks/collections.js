import { applyAsyncLoading } from './loading';
import localDB from '../local-db';

// Actions
const SET_COLLECTIONS = 'GET_ALL_COLLECTIONS';

// Action Creators
export const getAllCollections = applyAsyncLoading(() =>
  dispatch =>
    localDB.table('collections')
      .toArray()
      .then((collections) => {
        dispatch(({
          type: SET_COLLECTIONS,
          payload: collections,
        }));
      })
);

const INITIAL_STATE = {
  collections: [],
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_COLLECTIONS:
      return { collections: action.payload };
    default:
      return state;
  }
}
