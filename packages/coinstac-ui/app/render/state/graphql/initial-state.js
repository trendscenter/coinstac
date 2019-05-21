import { GET_ALL_COLLECTIONS } from './functions';

function initializeState(cache) {
  cache.writeQuery({
    query: GET_ALL_COLLECTIONS,
    data: { collections: [] }
  });
}

export default initializeState;
