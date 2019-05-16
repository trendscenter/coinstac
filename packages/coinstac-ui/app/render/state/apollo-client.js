import { ApolloClient } from 'apollo-client';
import { setContext } from 'apollo-link-context';
import { ApolloLink, split } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { persistCache } from 'apollo-cache-persist';
import { getMainDefinition } from 'apollo-utilities';
import initializeState from './graphql/initial-state';
import GraphQLLocalSchema from './graphql/schema';
import GraphQLLocalResolvers from './graphql/resolvers';

export default async function getApolloClient(config) {
  const { apiServer, subApiServer } = config.getProperties();

  const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;
  const httpLink = createHttpLink({ uri: `${API_URL}/graphql` });

  const SUB_URL = `${subApiServer.protocol}//${subApiServer.hostname}${subApiServer.port ? `:${subApiServer.port}` : ''}${subApiServer.pathname}`;
  const wsLink = new WebSocketLink({
    uri: `${SUB_URL}/graphql`,
    options: {
      reconnect: true,
    },
  });

  const middlewareLink = setContext(() => {
    // get the authentication token from local storage if it exists
    let token = localStorage.getItem('id_token');

    if (!token || token === 'null' || token === 'undefined') {
      token = sessionStorage.getItem('id_token');
    }

    return {
      headers: {
        authorization: token ? `Bearer ${token}` : null,
      },
    };
  });

  const logger = new ApolloLink((operation, forward) => {
    console.log(operation.operationName);
    return forward(operation).map((result) => {
      console.log(`received result from ${operation.operationName}`);
      return result;
    });
  });

  const composedHttpLink = ApolloLink.from([
    middlewareLink,
    logger,
    httpLink,
  ]);

  const link = split(
    // split based on operation type
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query);
      return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    composedHttpLink
  );

  const cache = new InMemoryCache();

  initializeState(cache);

  await persistCache({ cache, storage: localStorage });

  const client = new ApolloClient({
    link,
    cache,
    typeDefs: GraphQLLocalSchema,
    resolvers: GraphQLLocalResolvers,
  });

  return client;
}
