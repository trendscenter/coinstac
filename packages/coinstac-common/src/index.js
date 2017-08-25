'use strict';

const Base = require('./models/base');
const CommandComputation = require('./models/computation/command-computation');
const Computation = require('./models/computation/computation');
const ComputationResult = require('./models/computation/computation-result');
const Consortium = require('./models/consortium');
const DBListener = require('./models/db-listener');
const DecentralizedComputation = require('./models/decentralized-computation.js');
const File = require('./models/file');
const JavascriptComputation = require('./models/computation/javascript-computation');
const LocalComputationResult = require('./models/computation/local-computation-result');
const LocalPipelineRunner = require('./models/pipeline/runner/local-pipeline-runner');
const LocalPipelineRunnerPool = require('./models/pipeline/runner/pool/local-pipeline-runner-pool');
const Pipeline = require('./models/pipeline/pipeline.js');
const PipelineRunner = require('./models/pipeline/runner/pipeline-runner');
const PipelineRunnerPool = require('./models/pipeline/runner/pool/pipeline-runner-pool');
const PouchDocument = require('./models/pouch-document');
const Project = require('./models/project');
const RemoteComputationResult = require('./models/computation/remote-computation-result');
const RemotePipelineRunner = require('./models/pipeline/runner/remote-pipeline-runner');
const RemotePipelineRunnerPool =
  require('./models/pipeline/runner/pool/remote-pipeline-runner-pool');
const User = require('./models/user');
const dbRegistry = require('./services/db-registry');
const dockerManager = require('./services/docker-manager');
const getSyncedDatabase = require('./utils/get-synced-database');


module.exports = {
  helpers: {
    DBListener,
  },
  models: {
    computation: {
      CommandComputation,
      Computation,
      ComputationResult,
      RemoteComputationResult,
      LocalComputationResult,
      JavascriptComputation,
    },
    pipeline: {
      Pipeline,
      runner: {
        PipelineRunner,
        LocalPipelineRunner,
        RemotePipelineRunner,
        pool: {
          PipelineRunnerPool,
          LocalPipelineRunnerPool,
          RemotePipelineRunnerPool,
        },
      },
    },
    Base,
    DecentralizedComputation,
    Consortium,
    File,
    PouchDocument,
    Project,
    User,
  },
  services: {
    dbRegistry,
    dockerManager,
  },
  utils: {
    getSyncedDatabase,
  },
};
