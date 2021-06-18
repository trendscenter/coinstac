const {
  ApolloClient, InMemoryCache, ApolloLink, HttpLink, concat, split,
} = require('@apollo/client/core');
const { getMainDefinition } = require('@apollo/client/utilities');
const { WebSocketLink } = require('@apollo/client/link/ws');
const ws = require('ws');

function createApolloClient(authToken) {
  const httpLink = new HttpLink({ uri: `${process.env.API_URL}/graphql` });

  const wsLink = new WebSocketLink({
    uri: `${process.env.SUB_API_URL}/subscriptions`,
    options: {
      reconnect: true,
    },
    webSocketImpl: ws,
  });

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink
  );

  // add the authorization to the headers
  const authMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext({
      headers: {
        authorization: authToken,
      },
    });

    return forward(operation);
  });

  return new ApolloClient({
    link: concat(authMiddleware, splitLink),
    cache: new InMemoryCache(),
  });
}

module.exports = createApolloClient;
