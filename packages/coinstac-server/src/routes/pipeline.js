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

const connectionStart = (id, result) => {
  return authenticateServer()
  .then(() =>
    axios({
      method: 'post',
      url: `${config.apiServer}/graphql`,
      data: {
        query: `mutation($runId: ID!, $results: JSON) ${graphqlSchema.mutations.saveResults.replace(/\s{2,10}/g, ' ')}`,
        variables: {
          runId: id,
          results: result,
        },
      },
    })
  );
};

module.exports = [
  {
    method: 'POST',
    path: '/startPipeline',
    config: {
      // auth: 'jwt',
      handler: (req, res) => {
        const run = req.payload.run;
        const remotePipeline = this.remotePipelineManager.startPipeline({
          clients: run.clients,
          spec: run.pipelineSnapshot,
          runId: run.id,
        });

        res({}).code(201);

        remotePipeline.result.then((result) => {
          connectionStart(run.id, result);
        })
        .catch(() => {
          // TODO: save pipeline errors!
        });
      },
    },
  },
];
