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
          }),
        });
      }

      let throwCount = Object.keys(pipelines).length;
      const allResults = Promise.all(Object.keys(pipelines).map((key) => {
        if (key === 'locals') {
          return Promise.all(pipelines[key].map(
            (localP, index) => localP.pipeline.result
              .then((res) => { pipelines[key][index].pipeline.result = res; })
              .catch((e) => {
                // see if you're the last node to err, throw is so
                throwCount -= 1;
                if (throwCount === 0) throw e;
              })
          ));
        }
        return pipelines.remote.pipeline.result
          .then((res) => { pipelines[key].pipeline.result = res; })
          .catch((e) => {
            // see if you're the last node to err, throw is so
            throwCount -= 1;
            if (throwCount === 0) throw e;
          });
      }))
        .then(() => {
          if (runMode === 'decentralized') {
            return { remote: pipelines.remote.pipeline.result };
          }
          return { locals: pipelines.locals.map(local => local.pipeline.result) };
        });

      return { pipelines, allResults };
    });
};
module.exports = {
  startRun,
};
