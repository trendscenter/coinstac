const test = require('ava').test;
const computationSpecs = require('./computation-specs');
const path = require('path');
const PipelineManager = require('../src/pipeline-manager');
const DockerManager = require('coinstac-docker-manager');
const rimraf = require('rimraf-promise');

const localCompSpec = computationSpecs.local;
const localErrorCompSpec = computationSpecs.localError;
const decentralizedCompSpec = computationSpecs.decentralized;
const decentralizedErrorCompSpec = computationSpecs.decentralizedError;

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

const localErrorPipelineSpec = {
  steps: [
    {
      controller: { type: 'local' },
      computations: [localErrorCompSpec],
      inputMap: {
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

// errors on the remote
const decentralizedErrorPipelineSpec = {
  steps: [
    {
      controller: { type: 'decentralized' },
      computations: [decentralizedErrorCompSpec],
      inputMap: {
        mode: { value: 'remote' },
      },
    },
  ],
};

// errors on the local node
const decentralizedErrorLocalPipelineSpec = {
  steps: [
    {
      controller: { type: 'decentralized' },
      computations: [decentralizedErrorCompSpec],
      inputMap: {
        mode: { value: 'local' },
        user: { value: 'one' },
      },
    },
  ],
};

let remote;
let local;
let local2;
let local3;
let local4;

test.before(() => {
  const proms = [];
  const docker = new DockerManager.Docker();
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

  remote = PipelineManager.create({
    mode: 'remote',
    clientId: 'remote',
    operatingDirectory: path.resolve(__dirname, 'remote'),
  });

  local = PipelineManager.create({
    mode: 'local',
    clientId: 'one',
    operatingDirectory: path.resolve(__dirname, 'local'),
  });
  local2 = PipelineManager.create({
    mode: 'local',
    clientId: 'two',
    operatingDirectory: path.resolve(__dirname, 'local2'),
  });
  local3 = PipelineManager.create({
    mode: 'local',
    clientId: 'three',
    operatingDirectory: path.resolve(__dirname, 'local3'),
  });
  local4 = PipelineManager.create({
    mode: 'local',
    clientId: 'four',
    operatingDirectory: path.resolve(__dirname, 'local4'),
  });

  return Promise.all(proms);
});

test('test mixed decent/local pipeline', (t) => {
  const remotePipeline = remote.startPipeline({
    clients: ['one'],
    spec: mixedPipelineSpec,
    runId: 'remotetest1',
  });
  const localPipeline = local.startPipeline({
    spec: mixedPipelineSpec,
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

test('test decentralized error from remote and local node', (t) => {
  const remotePipeline = remote.startPipeline({
    clients: ['one', 'three'],
    spec: decentralizedErrorPipelineSpec,
    runId: 'remoteError',
  });

  const remotePipeline2 = remote.startPipeline({
    clients: ['one', 'three'],
    spec: decentralizedErrorLocalPipelineSpec,
    runId: 'remoteErrorLocal',
  });
  const localPipeline = local.startPipeline({
    spec: decentralizedErrorPipelineSpec,
    runId: 'remoteError',
  });
  const localPipeline2 = local3.startPipeline({
    spec: decentralizedErrorPipelineSpec,
    runId: 'remoteError',
  });

  const localPipeline3 = local.startPipeline({
    spec: decentralizedErrorLocalPipelineSpec,
    runId: 'remoteErrorLocal',
  });

  return Promise.all([
    localPipeline.result.catch((error) => {
      t.true(error.message.includes('remote throws error'));
    }),
    localPipeline2.result.catch((error) => {
      t.true(error.message.includes('remote throws error'));
    }),
    remotePipeline.result.catch((error) => {
      t.true(error.message.includes('remote throws error'));
    }),
    remotePipeline2.result.catch((error) => {
      t.true(error.message.includes('local throws error'));
    }).then(() => {
      // check to see if it'll stop after the pipe has finished.
      const localPipeline4 = local3.startPipeline({
        spec: decentralizedErrorLocalPipelineSpec,
        runId: 'remoteErrorLocal',
      });
      return localPipeline4.result.catch((error) => {
        t.true(error.message.includes('local throws error'));
      });
    }),
    localPipeline3.result.catch((error) => {
      t.true(error.message.includes('local throws error'));
    }),
  ]);
});


test('test local pipeline + cache', (t) => {
  const pipeline = local2.startPipeline({
    spec: localPipelineSpec,
    runId: 'localtest1',
  });
  return pipeline.result.then((result) => {
    t.is(result.sum, 5);
  });
});

test('test local error', (t) => {
  const pipeline = local4.startPipeline({
    spec: localErrorPipelineSpec,
    runId: 'localError',
  });
  return pipeline.result.catch((error) => {
    t.true(error.message.includes('local only throws error'));
  });
});

test.after.always('cleanup', () => {
  return Promise.all([
    rimraf('./local*'),
    rimraf('./remote'),
  ]);
});
