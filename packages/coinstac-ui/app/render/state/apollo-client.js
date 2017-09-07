import {
  ApolloClient,
  addTypeName,
  createNetworkInterface,
} from 'react-apollo';

const client = new ApolloClient({
  networkInterface: createNetworkInterface({ uri: 'http://localhost:3100/graphql' }),
  queryTransformer: addTypeName,
  dataIdFromObject: o => o.id,
});

client.networkInterface.use([{
  applyMiddleware(req, next) {
    if (!req.options.headers) {
      req.options.headers = {};  // Create the header object if needed.
    }
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem('id_token');
    req.options.headers.authorization = token ? `Bearer ${token}` : null;
    next();
  },
}]);

export default client;
