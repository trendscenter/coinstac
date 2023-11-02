/* eslint-disable no-console */
const PipelineManager = require('coinstac-pipeline');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const graphqlSchema = require('coinstac-graphql-schema');
const { pullImagesFromList } = require('coinstac-container-manager');

const manager = PipelineManager.create({
  mode: 'remote',
  clientId: 'remote',
  operatingDirectory: path.resolve(process.env.PIPELINE_SERVER_OPERARTING_DIR, 'coinstac'),
  mqttRemotePort: process.env.MQTT_SERVER_PORT,
  mqttRemoteWSPort: process.env.MQTT_SERVER_WS_PORT,
  mqttRemoteProtocol: process.env.MQTT_SERVER_PROTOCOL,
  mqttRemoteWSProtocol: process.env.MQTT_SERVER_WS_PROTOCOL,
  mqttRemoteURL: process.env.MQTT_SERVER_HOSTNAME,
  mqttSubChannel: process.env.MQTT_SUB_CHANNEL,
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

      console.log(`Server update ${runId}:`); // eslint-disable-line no-console
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
      method: 'GET',
      path: '/getPipelines',
      config: {
        handler: async (req, h) => {
          // get the info
          const pipelineInfo = await remotePipelineManager.getPipelines();
          // return the info

          return h.response(pipelineInfo).code(200);
        },
      },
    },
    {
      method: 'POST',
      path: '/startPipeline',
      config: {
        // auth: 'jwt',
        handler: (req, h) => {
          return authenticateServer()
            .then(() => {
              const { payload: { run } } = req;

              const computationImageList = run.pipelineSnapshot.steps
                .map(step => step.computations
                  .map(comp => comp.computation.dockerImage))
                .reduce((acc, val) => acc.concat(val), []);

              return pullImagesFromList(computationImageList)
                .then(() => {
                  try {
                    const { result, stateEmitter } = remotePipelineManager.startPipeline({
                      clients: run.clients,
                      spec: run.pipelineSnapshot,
                      runId: run.id,
                      timeout: run.pipelineSnapshot.timeout,
                    });

                    stateEmitter.on('update', (data) => {
                      // TODO:  console most likely should be removed post proto development
                      // or made less noisy
                      updateRunMessageQueue.push({ runId: run.id, data });
                      updateRunState();
                    });

                    result
                      .then((result) => {
                        saveResults(run.id, result);
                      })
                      .catch((error) => {
                        console.log('\n============ Pipeline Failed ===========');
                        if (error.message) {
                          console.log(chalk.bold.red('**** Message ****'));
                          error.message.split('\n').map(err => console.log(chalk.bold.red(err.trim())));
                        }

                        if (error.error) {
                          console.log(chalk.yellow('\n**** Error ****'));
                          error.error.split('\n').map(err => console.log(chalk.yellow(err.trim())));
                        }

                        if (error.stack) {
                          console.log(chalk.bold.red('\n**** Stack ****'));
                          error.stack.split('\n').map(err => console.log(chalk.red(err)));
                        }
                        console.log('============ Pipeline Failed ===========\n');

                        saveError(run.id, error);
                      });
                    return h.response({}).code(201);
                  } catch (error) {
                    console.error(error);
                    return h.response({ error }).code(500);
                  }
                });
            }).catch((error) => {
              console.error(error);
              return h.response({ error }).code(500);
            });
        },
      },
    },
    {
      method: 'POST',
      path: '/stopPipeline',
      config: {
        // auth: 'jwt',
        handler: (req, h) => {
          return authenticateServer()
            .then(() => {
              const { payload: { runId } } = req;
              return remotePipelineManager.stopPipeline(runId, 'user')
                .then(() => {
                  return h.response({}).code(200);
                }).catch((e) => {
                  console.error(e); // eslint-disable-line no-console
                  return h.response({}).code(500);
                });
            });
        },
      },
    },
  ];
});
