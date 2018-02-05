'use strict';

const Pipeline = require('coinstac-pipeline');
const path = require('path');

const startRun = (spec, runMode = 'local', clientCount = 1, operatingDirectory = './') => {
  const pipelines = {
    locals: [],
    remote: {},
  };
  if (runMode === 'remote') {
    const remoteManager = Pipeline.create({
      clientId: 'remote',
      mode: 'remote',
      operatingDirectory: path.resolve(operatingDirectory, 'remote'),
    });
    pipelines.remote = {
      manager: remoteManager,
      pipeline: remoteManager.start({
        spec,
        runId: 'simulatorRun',
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
      pipeline: localPipelineManager.start({
        spec,
        runId: 'simulatorRun',
      }),
    });
  }

  return Promise.all(Object.keys(pipelines).map((key) => {
    if (key === 'locals') {
      return Promise.all(pipelines[key].map(() => key.pipeline.result));
    }
    return pipelines.remote.pipeline.result;
  }))
  .then(() => {
    debugger;
    if (runMode === 'remote') {
      return pipelines.remote.pipeline.result;
    }
  });
};
module.exports = {
  startRun,
};
