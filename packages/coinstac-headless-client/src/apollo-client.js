const {
  ApolloClient, InMemoryCache, ApolloLink, HttpLink, concat, split,
} = require('@apollo/client/core');
const { getMainDefinition } = require('@apollo/client/utilities');
const { WebSocketLink } = require('@apollo/client/link/ws');
const ws = require('ws');

function createApolloClient(config, authToken) {
  const { apiServer, subApiServer } = config;

  const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;

  const httpLink = new HttpLink({ uri: `${API_URL}/graphql` });

  const SUB_URL = `${subApiServer.protocol}//${subApiServer.hostname}${subApiServer.port ? `:${subApiServer.port}` : ''}${subApiServer.pathname}`;

  const wsLink = new WebSocketLink({
    uri: `${SUB_URL}/subscriptions`,
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
