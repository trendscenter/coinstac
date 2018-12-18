import {
  ApolloClient,
  addTypeName,
  createBatchingNetworkInterface,
} from 'react-apollo';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';

export default function getApolloClient(config) {
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
      let token = localStorage.getItem('id_token');

      if (!token || token === 'null' || token === 'undefined') {
        token = sessionStorage.getItem('id_token');
      }

      req.options.headers.authorization = token ? `Bearer ${token}` : null;
      next();
    },
  }]);

  return client;
}
