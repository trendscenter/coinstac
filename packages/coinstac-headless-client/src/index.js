require('cross-fetch/polyfill');
const authenticate = require('./auth');
const createApolloClient = require('./apollo-client');
const subscribeToNewRuns = require('./subscription');
const { initialize } = require('./pipeline-run-manager');

async function start() {
  try {
    const { authToken, client } = await authenticate();

    const apolloClient = createApolloClient(authToken);

    await initialize(client, authToken);

    subscribeToNewRuns(client.id, apolloClient);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('An unexpected error has occurred', error);
  }
}

start();
