require('cross-fetch/polyfill');
const loadConfig = require('./config');
const authenticate = require('./auth');
const createApolloClient = require('./apollo-client');
const subscribeToNewRuns = require('./subscription');
const { initialize } = require('./pipeline-run-manager');

async function start() {
  try {
    const config = loadConfig();

    const authData = await authenticate(config);

    const apolloClient = createApolloClient(config, authData.id_token);

    await initialize(config, authData.id_token, authData.user, apolloClient);

    subscribeToNewRuns(apolloClient);
  } catch (error) {
    console.error('An unexpected error has occurred', error);
  }
}

start();
