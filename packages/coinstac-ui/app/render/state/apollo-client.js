import {
  ApolloClient,
  addTypeName,
  createBatchingNetworkInterface,
} from 'react-apollo';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';
import { ipcRenderer } from 'electron';
import { get } from 'lodash';
import { API_TOKEN_KEY } from './ducks/auth';
import { EXPIRED_TOKEN, BAD_TOKEN } from '../utils/error-codes';

const utf8Decoder = new TextDecoder('utf-8');

async function parseResponseBody(body) {
  const reader = body.getReader();

  let finishedReading = false;

  let responseBodyString = '';

  while (!finishedReading) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();

    if (value) {
      responseBodyString += utf8Decoder.decode(value);
    }

    finishedReading = done;
  }

  return JSON.parse(responseBodyString);
}

function getApolloClient(config) {
  const { apiServer, subApiServer } = config.getProperties();
  const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;
  const networkInterface = createBatchingNetworkInterface({
    uri: `${API_URL}/graphql`,
    batchInterval: 10,
  });

  const SUB_URL = `${subApiServer.protocol}//${subApiServer.hostname}${subApiServer.port ? `:${subApiServer.port}` : ''}${subApiServer.pathname}`;
  const wsClient = new SubscriptionClient(`${SUB_URL}/subscriptions`, { reconnect: true });
  const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
    networkInterface,
    wsClient
  );

  const client = new ApolloClient({
    networkInterface: networkInterfaceWithSubscriptions,
    queryTransformer: addTypeName,
    dataIdFromObject: o => o.id,
  });

  client.networkInterface.use([{
    applyBatchMiddleware(req, next) {
      if (!req.options.headers) {
        req.options.headers = {}; // Create the header object if needed.
      }

      // get the authentication token from local storage if it exists
      let token = localStorage.getItem(API_TOKEN_KEY);

      if (!token || token === 'null' || token === 'undefined') {
        token = sessionStorage.getItem(API_TOKEN_KEY);
      }

      token = JSON.parse(token);

      req.options.headers.authorization = token ? `Bearer ${token.token}` : null;
      next();
    },
  }]);

  client.networkInterface.useAfter([{
    applyBatchAfterware(res, next) {
      const body = get(res, 'responses.0.body');

      if (!body) {
        return next();
      }

      parseResponseBody(body)
        .then((responseBody) => {
          if (responseBody.statusCode !== 401) {
            return next();
          }

          if (responseBody.message === 'Expired token') {
            ipcRenderer.send(EXPIRED_TOKEN);
          } else {
            ipcRenderer.send(BAD_TOKEN);
          }
        });
    },
  }]);

  return client;
}

export default getApolloClient;
