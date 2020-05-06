'use strict';

const Pipeline = require('coinstac-pipeline');
const path = require('path');
const mosca = require('mosca');

/**
 * Starts a simulator run with the given pipeline spec
 *
 * @param  {Object} spec                       a valid pipeline spec
 * @param  {String} [runMode='local']          wether to run in local or decentralized mode
 * @param  {Number} [clientCount=1]            [description]
 * @param  {String} [operatingDirectory='test' }]            [description]
 * @return {[type]}                            [description]
 */
const startRun = ({
  spec, runMode = 'local', clientCount = 1, operatingDirectory = 'test',
}) => {
  const server = new mosca.Server({ port: 1883 });

  server.on('clientConnected', (client) => {
    console.log('Mosca client connected', client.id); // eslint-disable-line no-console
  });

  return new Promise((resolve) => {
    server.on('ready', resolve);
  })
    .then(async () => {
      const pipelines = {
        locals: [],
      };
      clientCount = parseInt(clientCount, 10);

      if (runMode === 'decentralized') {
        const remoteSpec = Array.isArray(spec) ? spec[0] : spec;
        const remoteManager = await Pipeline.create({
          clientId: 'remote',
          mode: 'remote',
          operatingDirectory: path.resolve(operatingDirectory),
        });
        pipelines.remote = {
          manager: remoteManager,
          pipeline: remoteManager.startPipeline({
            spec: remoteSpec,
            runId: 'simulatorRun',
            clients: Array.from(Array(clientCount)).map((val, idx) => `local${idx}`),
            owner: 'local0',
          }),
        };
      }
      for (let i = 0; i < clientCount; i += 1) {
        const localSpec = Array.isArray(spec) ? spec[i] : spec;
        const localPipelineManager = await Pipeline.create({ // eslint-disable-line no-await-in-loop, max-len
          clientId: `local${i}`,
          mode: 'local',
          operatingDirectory: path.resolve(operatingDirectory),
        });
        pipelines.locals.push({
          manager: localPipelineManager,
          pipeline: localPipelineManager.startPipeline({
            spec: localSpec,
            runId: 'simulatorRun',
            owner: 'local0',
          }),
        });
      }

      const allResults = Promise.all(Object.keys(pipelines).map((key) => {
        if (key === 'locals') {
          return Promise.all(pipelines[key].map(
            (localP, index) => localP.pipeline.result
              .then((res) => { pipelines[key][index].pipeline.result = res; })
              .catch((e) => {
                return e;
              })
          ));
        }
        return pipelines.remote.pipeline.result
          .then((res) => { pipelines[key].pipeline.result = res; })
          .catch((e) => {
            return e;
          });
      }))
        .then((errors) => {
          // error sent to remote or the first local for local runs
          if (errors[1] || errors[0][0]) throw errors[1] || errors[0][0];
          return {
            remote: pipelines.remote.pipeline.result,
            locals: pipelines.locals.map(local => local.pipeline.result),
          };
        });

      return { pipelines, allResults };
    });
};
module.exports = {
  startRun,
};
