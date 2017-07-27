import {
  ApolloClient,
  addTypeName,
  createNetworkInterface,
} from 'react-apollo';

const client = new ApolloClient({
  networkInterface: createNetworkInterface({ uri: 'http://localhost:3100/graphql' }),
  queryTransformer: addTypeName,
});
export default client;
