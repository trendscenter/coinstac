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
  operatingDirectory: path.resolve(__dirname, 'remote'),
});

const authenticateServer = () => {
  return axios.post(
    `${config.DB_URL}/authenticate`,
    dbmap.rethinkdbServer
  )
  .then((token) => {
    this.id_token = token.data.id_token;
    axios.defaults.headers.common.Authorization = `Bearer ${this.id_token}`;
    return this.id_token;
  });
};

const connectionStart = (id, result) => {
  return authenticateServer()
  .then(() =>
    axios.post(`${config.DB_URL}/graphql`,
      {
        operationName: 'saveResults',
        query: `mutation ${graphqlSchema.mutations.saveResults}`,
        variables: {
          runId: id,
          results: result,
        },
      }
  ))
  .catch((error) => {
    console.log(error);
  });
};

module.exports = [
  {
    method: 'POST',
    path: '/startPipeline',
    config: {
      // auth: 'jwt',
      handler: (req, res) => {
        console.log('Pipeline is starting');

        const run = req.payload.run;
        const remotePipeline = this.remotePipelineManager.startPipeline({
          clients: run.clients,
          spec: run.pipelineSnapshot,
          runId: run.id,
        });

        res({}).code(201);

        remotePipeline.result.then((result) => {
          console.log('Pipeline is done. Sending results...');
          connectionStart(run.id, result);
        })
        .catch((error) => {
          console.log(error);
        });
      },
    },
  },
];
