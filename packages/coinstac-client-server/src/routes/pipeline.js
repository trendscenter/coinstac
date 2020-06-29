/* eslint-disable max-len */

const PipelineManager = require('coinstac-pipeline');
const { pullImagesFromList, removeImagesFromList } = require('coinstac-docker-manager');
const path = require('path');
const config = require('../config');

const manager = PipelineManager.create({
  mode: 'remote',
  clientId: 'remote',
  operatingDirectory: path.resolve(config.operatingDirectory, 'coinstac'),
  remotePort: 3400,
  mqttRemotePort: config.mqttServer.port,
  mqttRemoteProtocol: config.mqttServer.protocol,
  mqttRemoteURL: config.mqttServer.hostname,
});

const updateRunState = () => {};

const saveError = () => {};

const saveResults = () => {};

module.exports = manager.then((remotePipelineManager) => {
  return [
    {
      method: 'POST',
      path: '/pullImages',
      handler: async (req, res) => {
        const { payload: { images } } = req;

        try {
          await pullImagesFromList(images);
          return res.response('Pulled images.').code(200);
        } catch (error) {
          return res.response(error.message).code(400);
        }
      },
    },
    {
      method: 'POST',
      path: '/removeImages',
      handler: async (req, res) => {
        const { payload: { images } } = req;

        try {
          await removeImagesFromList(images);
          return res.response('Pulled images.').code(200);
        } catch (error) {
          return res.response(error.message).code(400);
        }
      },
    },
    {
      method: 'POST',
      path: '/startPipeline',
      handler: (req, res) => {
        const { payload: { run } } = req;

        const computationImageList = run.pipelineSnapshot.steps
          .map(step => step.computations
            .map(comp => comp.computation.dockerImage))
          .reduce((acc, val) => acc.concat(val), []);

        pullImagesFromList(computationImageList)
          .then(() => {
            const { result, stateEmitter } = remotePipelineManager.startPipeline({
              clients: run.clients,
              spec: run.pipelineSnapshot,
              runId: run.id,
              timeout: run.pipelineSnapshot.timeout,
            });

            stateEmitter.on('update', (data) => {
              updateRunState(run.id, data);
            });

            result
              .then((result) => {
                saveResults(run.id, result);
              })
              .catch((error) => {
                saveError(run.id, error);
              });

            return res.response('Started pipeline successfully').code(201);
          });
      },
    },
    {
      method: 'GET',
      path: '/stopPipeline/{runId}',
      handler: async (req, res) => {
        const { runId } = req.params;

        try {
          await remotePipelineManager.stopPipeline('', runId);
          return res.response('Stopped pipeline.').code(200);
        } catch (error) {
          return res.response(error.message).code(400);
        }
      },
    },
  ];
});
