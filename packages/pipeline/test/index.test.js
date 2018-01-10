const test = require('ava').test;
const computationSpecs = require('./computation-specs');
const path = require('path');
const PipelineManager = require('../pipeline-manager');
const dockerManager = require('../../coinstac-docker-manager/src/index');
const rimraf = require('rimraf-promise');

const localCompSpec = computationSpecs.local;
const decentralizedCompSpec = computationSpecs.decentralized;

const localPipelineSpec = {
  steps: [
    {
      controller: 'local',
      computations: [localCompSpec],
      inputMap: {
        start: { value: 1 },
      },
    },
    {
      controller: 'local',
      computations: [localCompSpec],
      inputMap: {
        start: { fromCache: { step: 0, variable: 'sum' } },
      },
    },
  ],
};

const remotePipelineSpec = {
  steps: [
    {
      controller: 'decentralized',
      computations: [decentralizedCompSpec],
      inputMap: {
        start: { value: 1 },
      },
    },
  ],
};

test((t) => {
  const remote = PipelineManager.create({
    mode: 'remote',
    clientId: 'remote',
    operatingDirectory: path.resolve(__dirname, 'remote'),
  });
  const remotePipeline = remote.startPipeline({
    clients: ['one'],
    spec: remotePipelineSpec,
    runId: 'remotetest1',
  });

  const local = PipelineManager.create({
    mode: 'local',
    clientId: 'one',
    operatingDirectory: path.resolve(__dirname, 'local'),
  });
  const localPipeline = local.startPipeline({
    spec: remotePipelineSpec,
    runId: 'remotetest1',
  });
  return Promise.all([
    localPipeline.result.then((result) => {
      t.is(result.sum, 5);
    }),
    remotePipeline.result.then((result) => {
      t.is(result.sum, 5);
    }),
  ]);
});

test((t) => {
  const local = PipelineManager.create({
    mode: 'local',
    clientId: 'two',
    operatingDirectory: path.resolve(__dirname, 'local'),
  });
  const pipeline = local.startPipeline({
    spec: localPipelineSpec,
    runId: 'localtest1',
  });
  return pipeline.result.then((result) => {
    t.is(result.sum, 5);
  });
});

test.after.always('cleanup', () => {
  return Promise.all([
    dockerManager.stopAllServices(),
    rimraf('./local'),
    rimraf('./remote'),
  ]);
});
