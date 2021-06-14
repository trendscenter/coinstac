import { ipcRenderer } from 'electron';
import {
  ApolloClient, InMemoryCache, ApolloLink, HttpLink, split, concat,
} from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';

import { API_TOKEN_KEY } from './ducks/auth';
import { EXPIRED_TOKEN, BAD_TOKEN } from '../utils/error-codes';

function getApolloClient(config) {
  const { apiServer, subApiServer } = config.getProperties();
  const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;
  const httpLink = new HttpLink({ uri: `${API_URL}/graphql` });

  const SUB_URL = `${subApiServer.protocol}//${subApiServer.hostname}${subApiServer.port ? `:${subApiServer.port}` : ''}${subApiServer.pathname}`;
  const wsLink = new WebSocketLink({
    uri: `${SUB_URL}/graphql`,
    options: { reconnect: true },
  });

  const unauthorizedLink = onError(({ networkError }) => {
    if (networkError.statusCode !== 401) {
      return;
    }

    if (networkError.message === 'Expired token') {
      ipcRenderer.send(EXPIRED_TOKEN);
    } else {
      ipcRenderer.send(BAD_TOKEN);
    }
  });

  // const authMiddleware = new ApolloLink((operation, forward) => {
  //   // get the authentication token from local storage if it exists
  //   let token = localStorage.getItem(API_TOKEN_KEY);

  //   if (!token || token === 'null' || token === 'undefined') {
  //     token = sessionStorage.getItem(API_TOKEN_KEY);
  //   }

  //   token = JSON.parse(token);

  //   operation.setContext(({ headers = {} }) => ({
  //     headers: {
  //       ...headers,
  //       authorization: token ? `Bearer ${token}` : null,
  //     },
  //   }));

  //   return forward(operation);
  // });

  const splitLink = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query);
      return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    // concat(authMiddleware, httpLink)
    httpLink
  );

  return new ApolloClient({
    link: unauthorizedLink.concat(splitLink),
    cache: new InMemoryCache(),
  });
}

export default getApolloClient;
