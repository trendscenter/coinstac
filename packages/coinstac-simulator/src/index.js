'use strict';

const Pipeline = require('coinstac-pipeline');
const path = require('path');

/**
 * Starts a simulator run with the given pipeline spec
 *
 * @param  {Object} spec                       a valid pipeline spec
 * @param  {String} [runMode='local']          wether to run in local or decentralized mode
 * @param  {Number} [clientCount=1]            [description]
 * @param  {String} [operatingDirectory='test' }]            [description]
 * @return {[type]}                            [description]
 */
const startRun = ({ spec, runMode = 'local', clientCount = 1, operatingDirectory = 'test' }) => {
  const pipelines = {
    locals: [],
  };
  if (runMode === 'decentralized') {
    const remoteManager = Pipeline.create({
      clientId: 'remote',
      mode: 'remote',
      operatingDirectory: path.resolve(operatingDirectory, 'remote'),
    });
    pipelines.remote = {
      manager: remoteManager,
      pipeline: remoteManager.startPipeline({
        spec,
        runId: 'simulatorRun',
        clients: Array.from(Array(clientCount)).map((val, idx) => `local${idx}`),
      }),
    };
  }
  for (let i = 0; i < clientCount; i += 1) {
    const localPipelineManager = Pipeline.create({
      clientId: `local${i}`,
      mode: 'local',
      operatingDirectory: path.resolve(operatingDirectory, `local${i}`),
    });
    pipelines.locals.push({
      manager: localPipelineManager,
      pipeline: localPipelineManager.startPipeline({
        spec,
        runId: 'simulatorRun',
      }),
    });
  }

  return Promise.all(Object.keys(pipelines).map((key) => {
    if (key === 'locals') {
      return Promise.all(pipelines[key].map(
        (localP, index) => localP.pipeline.result
          .then((res) => { pipelines[key][index].pipeline.result = res; })
      ));
    }
    return pipelines.remote.pipeline.result
      .then((res) => { pipelines[key].pipeline.result = res; });
  }))
  .then(() => {
    if (runMode === 'decentralized') {
      return { remote: pipelines.remote.pipeline.result };
    }
    return { locals: pipelines.locals.map(local => local.pipeline.result) };
  });
};
module.exports = {
  startRun,
};
