'use strict';
const PipelineRunnerPool =
    require('./models/pipeline/runner/pool/pipeline-runner-pool');
const LocalPipelineRunnerPool =
    require('./models/pipeline/runner/pool/local-pipeline-runner-pool');
const RemotePipelineRunnerPool =
    require('./models/pipeline/runner/pool/remote-pipeline-runner-pool');

module.exports = {
  models: {
    computation: {
      CommandComputation: require('./models/computation/command-computation'),
      Computation: require('./models/computation/computation'),
      ComputationResult: require('./models/computation/computation-result'),
      RemoteComputationResult: require('./models/computation/remote-computation-result'),
      LocalComputationResult: require('./models/computation/local-computation-result'),
      JavascriptComputation: require('./models/computation/javascript-computation'),
    },
    pipeline: {
      Pipeline: require('./models/pipeline/pipeline.js'),
      runner: {
        PipelineRunner: require('./models/pipeline/runner/pipeline-runner'),
        LocalPipelineRunner: require('./models/pipeline/runner/local-pipeline-runner'),
        RemotePipelineRunner: require('./models/pipeline/runner/remote-pipeline-runner'),
        pool: {
          PipelineRunnerPool,
          LocalPipelineRunnerPool,
          RemotePipelineRunnerPool,
        },
      },
    },
    Base: require('./models/base'),
    DecentralizedComputation: require('./models/decentralized-computation.js'),
    Consortium: require('./models/consortium'),
    File: require('./models/file'),
    PouchDocument: require('./models/pouch-document'),
    Project: require('./models/project'),
    User: require('./models/user'),
  },
  services: {
    dbRegistry: require('./services/db-registry'),
    computationRegistry: require('./services/computation-registry-factory'),
  },
};
