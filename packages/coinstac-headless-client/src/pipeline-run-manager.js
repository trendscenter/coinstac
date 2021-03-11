const { gql } = require('@apollo/client/core');
const CoinstacClientCore = require('coinstac-client-core');
const winston = require('winston');
const path = require('path');
const parseCsvFiles = require('./parse-csv-files');
const mapData = require('./data-map');

const HEADLESS_CLIENT_CONFIG_QUERY = gql`
  query fetchHeadlessClientConfig($clientId: ID) {
    fetchHeadlessClientConfig(clientId: $clientId) {
      id
      name
      computationWhitelist
    }
  }
`;

let core = null;
let headlessClientConfig = null;

async function initialize(config, authToken, user, apolloClient) {
  const logger = winston.loggers.add('coinstac-main', {
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({
        level, message, timestamp,
      }) => `${timestamp} { message: ${message}, level: ${level} }`)
    ),
    transports: [new winston.transports.Console()],
  });

  const clientCoreConfig = {
    ...config,
    token: authToken,
    userId: process.env.HEADLESS_CLIENT_ID,
    appDirectory: path.resolve('../'),
    logger,
  };

  core = new CoinstacClientCore(clientCoreConfig);
  await core.initialize();

  const { data: { fetchHeadlessClientConfig } } = await apolloClient.query({
    query: HEADLESS_CLIENT_CONFIG_QUERY,
    variables: { clientId: process.env.HEADLESS_CLIENT_ID },
  });

  headlessClientConfig = await parseCsvFiles(fetchHeadlessClientConfig);
}

async function startPipelineRun(run) {
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

  await core.Manager.pullImagesFromList(computationImageList);

  const { pipeline, result } = await core.startPipeline(
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

  core.unlinkFiles(run.id);
}

module.exports = {
  initialize,
  startPipelineRun,
};
