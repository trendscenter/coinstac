// const helperFunctions = require('../auth-helpers');
const PipelineManager = require('coinstac-pipeline');
const path = require('path');

this.pipelineManager = PipelineManager.create({
  mode: 'remote',
  clientId: 'remote',
  operatingDirectory: path.resolve(__dirname, 'remote'),
});

module.exports = [
  {
    method: 'POST',
    path: '/startPipeline',
    config: {
      // auth: 'jwt',
      handler: ({ run }, res) => {
        this.pipelineManager.startPipeline({
          spec: run.pipelineSnapshot,
          clients: run.clients,
          runId: run.id,
        });

        // TODO: What to return
        res({}).code(201);
      },
    },
  },
];
