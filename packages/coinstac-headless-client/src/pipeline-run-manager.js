/* eslint-disable no-console */
const CoinstacClientCore = require('coinstac-client-core');
const winston = require('winston');
const path = require('path');
const mkdirp = require('mkdirp');
const parseCsvFiles = require('./parse-csv-files');
const mapData = require('./data-map');

let core = null;
let headlessClientConfig = null;
const appDirectory = path.resolve('/tmp/.coinstac') || process.env.COINSTAC_HEADLESS_WORKDIR;

async function initialize(config, authToken) {
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
  await mkdirp(appDirectory);
  const clientCoreConfig = {
    fileServer: {
      hostname: process.env.FILE_SERVER_HOSTNAME,
      pathname: process.env.FILE_SERVER_HOSTNAME,
      port: process.env.FILE_SERVER_HOSTNAME,
      protocol: process.env.FILE_SERVER_HOSTNAME,
    },
    mqttServer: {
      hostname: process.env.MQTT_SERVER_HOSTNAME,
      pathname: process.env.MQTT_SERVER_PATHNAME,
      port: process.env.MQTT_SERVER_PORT,
      protocol: process.env.MQTT_SERVER_PROTOCOL,
    },
    mqttWSServer: {
      hostname: process.env.MQTT_WS_SERVER_HOSTNAME,
      pathname: process.env.MQTT_WS_SERVER_PATHNAME,
      port: process.env.MQTT_WS_SERVER_PORT,
      protocol: process.env.MQTT_WS_SERVER_PROTOCOL,
    },
    token: authToken,
    userId: config.id,
    appDirectory,
    logger,
  };

  core = new CoinstacClientCore(clientCoreConfig);
  await core.initialize();

  headlessClientConfig = await parseCsvFiles(config);
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
