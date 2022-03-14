#!/usr/bin/env node

require('cross-fetch/polyfill');
const { readFileSync } = require('fs');
const authenticate = require('./auth');
const createApolloClient = require('./apollo-client');
const subscribeToNewRuns = require('./subscription');
const { create } = require('./pipeline-run-manager');

const apiConf = JSON.parse(readFileSync(process.env.HEADLESS_CLIENT_CONFIG));

async function start() {
  apiConf.forEach(async (apiClient) => {
    try {
      const { authToken, client } = await authenticate(apiClient.apiKey, apiClient.name);

      const apolloClient = createApolloClient(authToken);

      const runManager = await create(client, authToken);

      subscribeToNewRuns(client.id, apolloClient, runManager);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('An unexpected error has occurred', error);
    }
  });
}

start();
