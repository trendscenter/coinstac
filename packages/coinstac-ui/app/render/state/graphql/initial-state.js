import { GET_ALL_ASSOCIATED_CONSORTIA } from './functions';

function initializeState(cache) {
  cache.writeQuery({
    query: GET_ALL_ASSOCIATED_CONSORTIA,
    data: {
      associatedConsortia: [],
    },
  });
}

export default initializeState;
