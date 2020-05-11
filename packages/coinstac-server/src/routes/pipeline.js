// const helperFunctions = require('../auth-helpers');
const PipelineManager = require('coinstac-pipeline');
const path = require('path');
const axios = require('axios');
const config = require('../config');
const graphqlSchema = require('coinstac-graphql-schema');
const { pullImagesFromList, pruneImages } = require('coinstac-docker-manager');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path, import/no-unresolved

const manager = PipelineManager.create({
  mode: 'remote',
  clientId: 'remote',
  operatingDirectory: path.resolve(config.operatingDirectory, 'coinstac'),
  mqttRemotePort: config.mqttServer.port,
  mqttRemoteProtocol: config.mqttServer.protocol,
  mqttRemoteURL: config.mqttServer.hostname,
});

const authenticateServer = () => {
  return axios.post(
    `${config.apiServer}/authenticate`,
    dbmap.apiCredentials
  )
    .then((token) => {
      this.id_token = token.data.id_token;
      axios.defaults.headers.common.Authorization = `Bearer ${this.id_token}`;
      return this.id_token;
    });
};

const updateRunState = (runId, data) => axios({
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

const saveError = (runId, error) => axios({
  method: 'post',
  url: `${config.apiServer}/graphql`,
  data: {
    query: `mutation($runId: ID!, $error: JSON) ${graphqlSchema.mutations.saveError.replace(/\s{2,10}/g, ' ')}`,
    variables: {
      runId,
      error,
    },
  },
});

const saveResults = (runId, results) => axios({
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

module.exports = manager.then((remotePipelineManager) => {
  return [
    {
      method: 'POST',
      path: '/startPipeline',
      config: {
        // auth: 'jwt',
        handler: (req, res) => {
          authenticateServer()
            .then(() => {
              const { payload: { run } } = req;

              const computationImageList = run.pipelineSnapshot.steps
                .map(step => step.computations
                  .map(comp => comp.computation.dockerImage))
                .reduce((acc, val) => acc.concat(val), []);

              pullImagesFromList(computationImageList)
                .then(() => pruneImages())
                .then(() => {
                  const { result, stateEmitter } = remotePipelineManager.startPipeline({
                    clients: run.clients,
                    spec: run.pipelineSnapshot,
                    runId: run.id,
                    timeout: run.pipelineSnapshot.timeout,
                  });
                  res({}).code(201);

                  stateEmitter.on('update', (data) => {
                    // TODO:  console most likely should be removed post proto development
                    // or made less noisy
                    console.log('Server update:'); // eslint-disable-line no-console
                    console.log(data); // eslint-disable-line no-console
                    updateRunState(run.id, data);
                  });

                  return result
                    .then((result) => {
                      saveResults(run.id, result);
                    })
                    .catch((error) => {
                      console.log(error); // eslint-disable-line no-console
                      saveError(run.id, error);
                    });
                });
            });
        },
      },
    },
  ];
});
