// const helperFunctions = require('../auth-helpers');
const PipelineManager = require('coinstac-pipeline');
const path = require('path');
const axios = require('axios');
const graphqlSchema = require('coinstac-graphql-schema');
const { pullImagesFromList, pruneImages } = require('coinstac-manager');

const manager = PipelineManager.create({
  mode: 'remote',
  clientId: 'remote',
  operatingDirectory: path.resolve(process.env.PIPELINE_SERVER_OPERARTING_DIR, 'coinstac'),
  mqttRemotePort: process.env.MQTT_SERVER_PORT,
  mqttRemoteWSPort: process.env.MQTT_SERVER_WS_PORT,
  mqttRemoteProtocol: process.env.MQTT_SERVER_PROTOCOL,
  mqttRemoteWSProtocol: process.env.MQTT_SERVER_WS_PROTOCOL,
  mqttRemoteURL: process.env.MQTT_SERVER_HOSTNAME,
});
const apiServer = `http://${process.env.API_SERVER_HOSTNAME}:${process.env.API_SERVER_PORT}`;

const DELAY = 100;

const updateRunMessageQueue = [];

let queueTimerId = null;

const authenticateServer = () => {
  return axios.post(
    `${apiServer}/authenticate`,
    {
      username: process.env.SERVER_API_USERNAME,
      password: process.env.SERVER_API_PASSWORD,
    }
  )
    .then((token) => {
      this.id_token = token.data.id_token;
      axios.defaults.headers.common.Authorization = `Bearer ${this.id_token}`;
      return this.id_token;
    });
};

const updateRunState = () => {
  if (!queueTimerId) {
    queueTimerId = setInterval(() => {
      const run = updateRunMessageQueue.shift();
      const { runId, data } = run;

      console.log('Server update:'); // eslint-disable-line no-console
      console.log(data); // eslint-disable-line no-console

      axios({
        method: 'post',
        url: `${apiServer}/graphql`,
        data: {
          query: `mutation($runId: ID!, $data: JSON) ${graphqlSchema.mutations.updateRunState.replace(/\s{2,10}/g, ' ')}`,
          variables: {
            runId,
            data,
          },
        },
      });

      if (updateRunMessageQueue.length === 0) {
        clearInterval(queueTimerId);
        queueTimerId = null;
      }
    }, DELAY);
  }
};

const saveError = (runId, error) => axios({
  method: 'post',
  url: `${apiServer}/graphql`,
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
  url: `${apiServer}/graphql`,
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
                    updateRunMessageQueue.push({ runId: run.id, data });
                    updateRunState();
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
    {
      method: 'POST',
      path: '/stopPipeline',
      config: {
        // auth: 'jwt',
        handler: (req, res) => {
          authenticateServer()
            .then(() => {
              const { payload: { runId } } = req;
              remotePipelineManager.stopPipeline(runId, 'user')
                .then(() => {
                  res({}).code(200);
                }).catch((e) => {
                  console.error(e); // eslint-disable-line no-console
                  res({}).code(500);
                });
            });
        },
      },
    },
  ];
});
