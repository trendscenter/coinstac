// const helperFunctions = require('../auth-helpers');
const PipelineManager = require('coinstac-pipeline');
const path = require('path');
const axios = require('axios');
const config = require('../../config/default');
const graphqlSchema = require('coinstac-graphql-schema');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path, import/no-unresolved

this.remotePipelineManager = PipelineManager.create({
  mode: 'remote',
  clientId: 'remote',
  operatingDirectory: path.resolve(config.operatingDirectory, 'remote'),
});

const authenticateServer = () => {
  return axios.post(
    `${config.apiServer}/authenticate`,
    dbmap.rethinkdbServer
  )
  .then((token) => {
    this.id_token = token.data.id_token;
    axios.defaults.headers.common.Authorization = `Bearer ${this.id_token}`;
    return this.id_token;
  });
};

const updateRunState = (runId, data) =>
  axios({
    method: 'post',
    url: `${config.apiServer}/graphql`,
    data: {
      query: `mutation($runId: ID!, $data: JSON) ${graphqlSchema.mutations.updateRunState.replace(/\s{2,10}/g, ' ')}`,
      variables: {
        runId,
        data,
      },
    },
  });

const saveError = (runId, error) =>
  axios({
    method: 'post',
    url: `${config.DB_URL}/graphql`,
    data: {
      query: `mutation($runId: ID!, $error: JSON) ${graphqlSchema.mutations.saveError.replace(/\s{2,10}/g, ' ')}`,
      variables: {
        runId,
        error,
      },
    },
  });

const saveResults = (runId, results) =>
  axios({
    method: 'post',
    url: `${config.apiServer}/graphql`,
    data: {
      query: `mutation($runId: ID!, $results: JSON) ${graphqlSchema.mutations.saveResults.replace(/\s{2,10}/g, ' ')}`,
      variables: {
        runId,
        results,
      },
    },
  });

module.exports = [
  {
    method: 'POST',
    path: '/startPipeline',
    config: {
      // auth: 'jwt',
      handler: (req, res) => {
        authenticateServer()
        .then(() => {
          const run = req.payload.run;
          const remotePipeline = this.remotePipelineManager.startPipeline({
            clients: run.clients,
            spec: run.pipelineSnapshot,
            runId: run.id,
          });

          res({}).code(201);

          remotePipeline.pipeline.stateEmitter.on('update', (data) => {
            updateRunState(run.id, data);
          });

          remotePipeline.result
            .then((result) => {
              saveResults(run.id, result);
            })
            .catch((error) => {
              saveError(run.id, error);
            });
        });
      },
    },
  },
];
