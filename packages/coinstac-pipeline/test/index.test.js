'use strict';

require('trace');
require('clarify');
const test = require('ava');
const path = require('path');
const { existsSync } = require('fs');
const DockerManager = require('coinstac-manager');
const pify = require('util').promisify;
const rimraf = pify(require('rimraf'));
const PipelineManager = require('../src/pipeline-manager');
const computationSpecs = require('./computation-specs');

const localCompSpec = computationSpecs.local;
const localErrorCompSpec = computationSpecs.localError;
const decentralizedCompSpec = computationSpecs.decentralized;
const decentralizedErrorCompSpec = computationSpecs.decentralizedError;
const { fileTest } = computationSpecs;
Error.stackTraceLimit = Infinity;


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

const decentralizedPipelineSpec = {
  steps: [
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

// errors on the local node
const fileTestSpec = {
  steps: [
    {
      controller: { type: 'decentralized' },
      computations: [fileTest],
      inputMap: {
        size: { value: 100 },
      },
    },
  ],
};

let remote;
let local;
let local2;
let local3;
let local4;

test.before(async () => {
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

  remote = await PipelineManager.create({
    mode: 'remote',
    clientId: 'remote',
    operatingDirectory: path.resolve(__dirname, 'tempCompDir'),
  });
  local = await PipelineManager.create({
    mode: 'local',
    clientId: 'one',
    operatingDirectory: path.resolve(__dirname, 'tempCompDir'),
  });
  local2 = await PipelineManager.create({
    mode: 'local',
    clientId: 'two',
    operatingDirectory: path.resolve(__dirname, 'tempCompDir'),
  });
  local3 = await PipelineManager.create({
    mode: 'local',
    clientId: 'three',
    operatingDirectory: path.resolve(__dirname, 'tempCompDir'),
  });
  local4 = await PipelineManager.create({
    mode: 'local',
    clientId: 'four',
    operatingDirectory: path.resolve(__dirname, 'tempCompDir'),
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

test('test pre remote start data preservation', (t) => {
  const localPipeline = local.startPipeline({
    spec: decentralizedPipelineSpec,
    runId: 'prePipe',
  });
  const localPipeline2 = local.startPipeline({
    spec: decentralizedPipelineSpec,
    runId: 'prePipeMultUser',
  });


  let once = true;
  let proxRej;
  let proxRes;
  const prom = new Promise((resolve, reject) => {
    proxRes = resolve;
    proxRej = reject;
  });
  let once2 = true;
  let proxRej2;
  let proxRes2;
  const prom2 = new Promise((resolve, reject) => {
    proxRes2 = resolve;
    proxRej2 = reject;
  });

  localPipeline.stateEmitter.on('update', (data) => {
    // allow time for remote server to get first iteration
    if (data.controllerState === 'waiting on central node' && once) {
      setTimeout(() => {
        once = false;
        const remotePipeline = remote.startPipeline({
          clients: ['one'],
          spec: decentralizedPipelineSpec,
          runId: 'prePipe',
        });
        remotePipeline.result
          .then((result) => {
            t.is(result.sum, 5);
            proxRes(result);
          }).catch(err => proxRej(err));
      }, 5000);
    }
  });
  localPipeline2.stateEmitter.on('update', (data) => {
    // allow time for remote server to get first iteration
    if (data.controllerState === 'waiting on central node' && once2) {
      setTimeout(() => {
        once2 = false;
        const remotePipeline = remote.startPipeline({
          clients: ['one', 'two'],
          spec: decentralizedPipelineSpec,
          runId: 'prePipeMultUser',
        });
        local2.startPipeline({
          spec: decentralizedPipelineSpec,
          runId: 'prePipeMultUser',
        });
        remotePipeline.result
          .then((result) => {
            t.is(result.sum, 5);
            proxRes2(result);
          }).catch(err => proxRej2(err));
      }, 5000);
    }
  });

  return Promise.all([prom, prom2]);
});

test('file transfer and output test', (t) => {
  const remotePipeline = remote.startPipeline({
    clients: ['one'],
    spec: fileTestSpec,
    runId: 'fileTest',
  });
  const localPipeline = local.startPipeline({
    spec: fileTestSpec,
    runId: 'fileTest',
  });

  return Promise.all([
    localPipeline.result.then((result) => {
      t.is(result.message, 'hashes match');
    }),
    remotePipeline.result.then((result) => {
      t.is(result.message, 'hashes match');
      result.files.forEach((file) => {
        t.is(existsSync(path.join('test', 'tempCompDir', 'input', 'one', 'fileTest', file)), true);
      });
    }),
  ]);
});

test.after.always('cleanup', () => {
  return Promise.all([
    rimraf('test/tempCompDir'),
  ]);
});
