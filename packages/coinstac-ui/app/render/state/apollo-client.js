import { ipcRenderer } from 'electron';
import {
  ApolloClient, InMemoryCache, ApolloLink, HttpLink, split, concat,
} from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';

import { API_TOKEN_KEY } from './ducks/auth';
import { EXPIRED_TOKEN } from '../utils/error-codes';

function getAuthToken() {
  // get the authentication token from local storage if it exists
  let token = localStorage.getItem(API_TOKEN_KEY);

  if (!token || token === 'null' || token === 'undefined') {
    token = sessionStorage.getItem(API_TOKEN_KEY);
  }

  return JSON.parse(token);
}

function getApolloClient({ apiServer, subApiServer }) {
  const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;
  const httpLink = new HttpLink({ uri: `${API_URL}/graphql` });

  const token = getAuthToken();

  const SUB_URL = `${subApiServer.protocol}//${subApiServer.hostname}${subApiServer.port ? `:${subApiServer.port}` : ''}${subApiServer.pathname}`;
  const wsLink = new WebSocketLink({
    uri: `${SUB_URL}/graphql`,
    options: {
      reconnect: true,
      connectionParams: () => {
        return { authToken: token ? token.token : '' };
      },
    },
  });

  const unauthorizedLink = onError((e) => {
    if (!e.networkError || e.networkError.statusCode !== 401) {
      return;
    }

    ipcRenderer.send(EXPIRED_TOKEN);
  });

  const authMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token.token}` : null,
      },
    }));

    return forward(operation);
  });

  const splitLink = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query);
      return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    concat(authMiddleware, httpLink)
  );

  return {
    client: new ApolloClient({
      link: unauthorizedLink.concat(splitLink),
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              searchDatasets: {
                merge: false, // prefer incoming server data over the data in the cache
              },
              fetchAllConsortia: {
                merge: false,
              },
            },
          },
        },
      }),
    }),
    wsLink,
  };
}

export default getApolloClient;
