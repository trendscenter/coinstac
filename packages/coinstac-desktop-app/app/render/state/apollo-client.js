import {
  ApolloClient, ApolloLink, concat,
  HttpLink, InMemoryCache, split,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { ipcRenderer } from 'electron';
import { useState } from 'react';

import { EXPIRED_TOKEN } from '../utils/error-codes';
import { API_TOKEN_KEY } from './ducks/constants';

function getAuthToken() {
  // get the authentication token from local storage if it exists
  let token = localStorage.getItem(API_TOKEN_KEY);

  if (!token || token === 'null' || token === 'undefined') {
    token = sessionStorage.getItem(API_TOKEN_KEY);
  }

  return JSON.parse(token);
}

function getApolloClient() {
  const { apiServer, subApiServer } = window.config;
  const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;
  const httpLink = new HttpLink({ uri: `${API_URL}/graphql` });

  const token = getAuthToken();
  const SUB_URL = `${subApiServer.protocol}//${subApiServer.hostname}${subApiServer.port ? `:${subApiServer.port}` : ''}${subApiServer.pathname}`;
  const wsLink = new WebSocketLink({
    uri: `${SUB_URL}/graphql`,
    options: {
      reconnect: true,
      connectionParams: () => ({ authToken: token ? token.token : '' }),
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
    concat(authMiddleware, httpLink),
  );

  return {
    client: new ApolloClient({
      link: unauthorizedLink.concat(splitLink),
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              // prefer incoming server data over the data in the cache
              searchDatasets: { merge: false },
              fetchAllConsortia: { merge: false },
              fetchAllPipelines: { merge: false },
            },
          },
        },
      }),
    }),
    wsLink,
  };
}

// partial solution from https://gist.github.com/tehpsalmist/d440b873c7465751dd829b5716d7ca81
const useApolloClient = () => {
  // store the initial client in State
  const [client, setClient] = useState(null);

  // return the current client from State and a function
  // for dynamically updating State with a new client
  return [client, () => {
    const newClient = getApolloClient();
    // lock the new client into State for use throughout the app
    return setClient(newClient);
  }];
};

export default useApolloClient;
