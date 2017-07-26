import {
  ApolloClient,
  createNetworkInterface,
  addTypeName,
} from 'react-apollo';

const client = new ApolloClient({
  networkInterface: createNetworkInterface('http://localhost:3100/graphql'),
  queryTransformer: addTypeName,
});
export default client;
