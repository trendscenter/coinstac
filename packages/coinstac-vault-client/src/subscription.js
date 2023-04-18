const { gql } = require('@apollo/client/core');
const { queries } = require('coinstac-graphql-schema');
const get = require('lodash/get');
const path = require('path');
const fs = require('fs').promises;
const parseHeadlessClientConfig = require('./parse-headless-client-config');
const mapData = require('./data-map');

const RUN_WITH_HEADLESS_CLIENT_STARTED_SUBSCRIPTION = gql`
  subscription runWithHeadlessClientStarted($clientId: ID)
    ${queries.runWithHeadlessClientStarted}
`;

const FETCH_HEADLESS_CLIENT_CONFIG_QUERY = gql`
  query fetchHeadlessClientConfig {
    fetchHeadlessClientConfig
  }
`;

const FETCH_RUN_QUERY = gql`
  query fetchRun($runId: ID!)
    ${queries.fetchRun}
`;

async function shouldUploadFiles(clientId, runId, apolloClient, appDirectory) {
  // are there files in the output directory?
  const runOutputDirectory = path.join(appDirectory, 'output', clientId, runId);
  const files = await fs.readdir(runOutputDirectory);
  if (files.length < 1) {
    return false;
  }

  // find the matching run document
  const { data } = await apolloClient.query({
    query: FETCH_RUN_QUERY,
    variables: { runId },
  });
  const run = data.fetchRun;

  // is this a vault only run?
  const clientIds = Object.keys(run.clients);
  const headlessMemeberIds = Object.keys(run.pipelineSnapshot.headlessMembers);
  const notVaultOnly = clientIds.some((id) => {
    return !headlessMemeberIds.includes(id);
  });

  if (notVaultOnly) {
    return false;
  }

  // is this clientId the first in the clients array?
  if (Object.keys(run.clients)[0] === (clientId)) {
    return true;
  }

  return false;
}
async function fetchHeadlessClientConfig(apolloClient) {
  const { data } = await apolloClient.query({
    query: FETCH_HEADLESS_CLIENT_CONFIG_QUERY,
    fetchPolicy: 'network-only',
  });

  const headlessClientConfig = get(data, 'fetchHeadlessClientConfig');

  if (!headlessClientConfig) {
    throw new Error('Could not find configuration in the API for this headless client');
  }

  return parseHeadlessClientConfig(headlessClientConfig);
}

async function startPipelineRun(
  run,
  headlessClientConfig,
  coinstacClientCore,
  apolloClient,
  clientId
) {
  if (!run) {
    throw new Error('Could not start the run, because it\'s empty');
  }

  const { filesArray, steps } = mapData(run.pipelineSnapshot, headlessClientConfig);

  const pipelineRun = {
    ...run,
    pipelineSnapshot: {
      ...run.pipelineSnapshot,
      steps,
    },
  };

  const computationImageList = run.pipelineSnapshot.steps
    .map(step => step.computations
      .map(comp => comp.computation.dockerImage))
    .reduce((acc, val) => acc.concat(val), []);

  await coinstacClientCore.containerManager.pullImagesFromList(computationImageList);
  const { pipeline, result } = await coinstacClientCore.startPipeline(
    null,
    pipelineRun.pipelineSnapshot.owningConsortium,
    pipelineRun.pipelineSnapshot,
    filesArray,
    run.id,
    run.pipelineSteps
  );

  // Listen for local pipeline state updates
  pipeline.stateEmitter.on('update', (data) => {
    console.log('Pipeline update', data);
  });
  await result;
  console.log('Pipeline finished');

  if (await shouldUploadFiles(clientId, run.id, apolloClient, coinstacClientCore.appDirectory)) {
    await coinstacClientCore.uploadFiles(run.id);
  }
  await coinstacClientCore.unlinkFiles(run.id);
}

async function subscribeToNewRuns(clientId, apolloClient, coinstacClientCore) {
  apolloClient.subscribe({
    query: RUN_WITH_HEADLESS_CLIENT_STARTED_SUBSCRIPTION,
    variables: { clientId },
  }).subscribe({
    next: async (data) => {
      const run = data.data.runWithHeadlessClientStarted;

      try {
        const headlessClientConfig = await fetchHeadlessClientConfig(apolloClient);

        await startPipelineRun(
          run,
          headlessClientConfig,
          coinstacClientCore,
          apolloClient,
          clientId
        );
      } catch (error) {
        console.error(`An error occurred on during a run: ${error}`);
      }
    },
    error: (error) => {
      // eslint-disable-next-line no-console
      console.error('An error occurred on the new runs subscription', error);
    },
  });
}

module.exports = subscribeToNewRuns;
