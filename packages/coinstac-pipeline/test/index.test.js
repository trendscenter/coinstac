const test = require('ava').test;
const computationSpecs = require('./computation-specs');
const path = require('path');
const PipelineManager = require('../src/pipeline-manager');
const dockerManager = require('coinstac-docker-manager');
const rimraf = require('rimraf-promise');

const localCompSpec = computationSpecs.local;
const decentralizedCompSpec = computationSpecs.decentralized;

const localPipelineSpec = {
  steps: [
    {
      controller: { type: 'local' },
      computations: [localCompSpec],
      inputMap: {
        start: { value: 1 },
      },
    },
    {
      controller: { type: 'local' },
      computations: [localCompSpec],
      inputMap: {
        start: { fromCache: { step: 0, variable: 'sum' } },
      },
    },
  ],
};

const mixedPipelineSpec = {
  steps: [
    {
      controller: { type: 'local' },
      computations: [localCompSpec],
      inputMap: {
        start: { value: 2 },
      },
    },
    {
      controller: { type: 'decentralized' },
      computations: [decentralizedCompSpec],
      inputMap: {
        start: { value: 1 },
      },
    },
  ],
};

test.before(() => {
  const proms = [];
  const docker = new dockerManager.Docker();
  const pullImage = (image) => {
    let proxRej;
    let proxRes;
    const prom = new Promise((res, rej) => {
      proxRes = res;
      proxRej = rej;
    });
    docker.pull(image, (err, stream) => {
      docker.modem.followProgress(stream, (err) => {
        if (!err) {
          proxRes();
        } else {
          proxRej(err);
        }
      });
    });
    return prom;
  };

  Object.keys(computationSpecs).forEach((key) => {
    proms.push(pullImage(computationSpecs[key].computation.dockerImage));
    if (computationSpecs[key].computation.remote) {
      proms.push(pullImage(computationSpecs[key].computation.remote.dockerImage));
    }
  });
  return Promise.all(proms);
});

// test.serial((t) => {
//   const remote = PipelineManager.create({
//     mode: 'remote',
//     clientId: 'remote',
//     operatingDirectory: path.resolve(__dirname, 'remote'),
//   });
//   const remotePipeline = remote.startPipeline({
//     clients: ['one'],
//     spec: mixedPipelineSpec,
//     runId: 'remotetest1',
//   });
//
//   const local = PipelineManager.create({
//     mode: 'local',
//     clientId: 'one',
//     operatingDirectory: path.resolve(__dirname, 'local'),
//   });
//   const localPipeline = local.startPipeline({
//     spec: mixedPipelineSpec,
//     runId: 'remotetest1',
//   });
//   return Promise.all([
//     localPipeline.result.then((result) => {
//       t.is(result.sum, 5);
//     }),
//     remotePipeline.result.then((result) => {
//       t.is(result.sum, 5);
//     }),
//   ]);
// });

test.serial((t) => {
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
//    dockerManager.stopAllServices().catch(), // already stopped containers can err out
    rimraf('./local'),
    rimraf('./remote'),
  ]);
});
