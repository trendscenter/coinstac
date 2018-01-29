// const helperFunctions = require('../auth-helpers');
const PipelineManager = require('coinstac-pipeline');
const path = require('path');

this.pipelineManager = PipelineManager.create({
  mode: 'remote',
  clientId: 'remote',
  operatingDirectory: path.resolve(__dirname, 'remote'),
});

const decentralized = {
  meta: {
    name: 'decentralized test',
    id: 'coinstac-decentralized-test',
    version: 'v1.0.0',
    repository: 'github.com/user/computation.git',
    description: 'a test that sums the last two numbers together for the next',
  },
  computation: {
    type: 'docker',
    dockerImage: 'coinstac/coinstac-decentralized-test',
    command: ['python', '/computation/local.py'],
    remote: {
      type: 'docker',
      dockerImage: 'coinstac/coinstac-decentralized-test',
      command: ['python', '/computation/remote.py'],
    },
    input: {
      start: {
        type: 'number',
      },
    },
    output: {
      sum: {
        type: 'number',
      },
    },
  },
};


const remotePipelineSpec = {
  steps: [
    {
      controller: 'decentralized',
      computations: [decentralized],
      inputMap: {
        start: { value: 1 },
      },
    },
  ],
};

module.exports = [
  {
    method: 'POST',
    path: '/startPipeline',
    config: {
      // auth: 'jwt',
      handler: ({ run }, res) => {
        this.pipelineManager.startPipeline({
          spec: remotePipelineSpec,
          runId: 'remotetest1',
        });

        // TODO: What to return
        res({}).code(201);
      },
    },
  },
];
