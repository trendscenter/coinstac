const { gql } = require('@apollo/client/core');
const { queries } = require('coinstac-graphql-schema');
const get = require('lodash/get');

const parseHeadlessClientConfig = require('./parse-headless-client-config');
const mapData = require('./data-map');

const FETCH_ALL_USER_RUNS_QUERY = gql`
  query fetchAllUserRuns {
    ${queries.fetchAllUserRuns}
  }
`;

const RUN_WITH_HEADLESS_CLIENT_STARTED_SUBSCRIPTION = gql`
  subscription runWithHeadlessClientStarted($clientId: ID)
    ${queries.runWithHeadlessClientStarted}
`;

const FETCH_HEADLESS_CLIENT_CONFIG_QUERY = gql`
  query fetchHeadlessClientConfig {
    fetchHeadlessClientConfig
  }
`;

async function shouldUploadFiles(userId, runId){
  
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

async function startPipelineRun(run, headlessClientConfig, coinstacClientCore, apolloClient) {
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

  await coinstacClientCore.Manager.pullImagesFromList(computationImageList);
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

  // determine: should the node I am, upload
  // are all of the members on this run vault users?
  // if so, am I the first on the list?
  let shouldUploadFiles = false;


  if (shouldUploadFiles) {
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

        await startPipelineRun(run, headlessClientConfig, coinstacClientCore, apolloClient);
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
