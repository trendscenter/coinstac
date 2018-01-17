import {
  ApolloClient,
  addTypeName,
  createBatchingNetworkInterface,
} from 'react-apollo';
import { apiServer } from '../../../config/local';

const API_URL = `${apiServer.protocol}//${apiServer.hostname}:${apiServer.port}`;

const client = new ApolloClient({
  networkInterface: createBatchingNetworkInterface({
    uri: `${API_URL}/graphql`,
    batchInterval: 10,
  }),
  queryTransformer: addTypeName,
  dataIdFromObject: o => o.id,
});

client.networkInterface.use([{
  applyBatchMiddleware(req, next) {
    if (!req.options.headers) {
      req.options.headers = {};  // Create the header object if needed.
    }

    // get the authentication token from local storage if it exists
    let token = localStorage.getItem('id_token');

    if (!token || token === 'null' || token === 'undefined') {
      token = sessionStorage.getItem('id_token');
    }

    req.options.headers.authorization = token ? `Bearer ${token}` : null;
    next();
  },
}]);

export default client;
