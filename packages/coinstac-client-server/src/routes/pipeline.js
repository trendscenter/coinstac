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

module.exports = manager.then((remotePipelineManager) => {
  return [
    {
      method: 'POST',
      path: '/pullImages',
      config: {
        handler: (req, res) => {
          const { payload: { images } } = req;

          pullImagesFromList(images)
            .then(() => {
              res('Pulled images.').code(200);
            });
        },
      },
    },
    {
      method: 'POST',
      path: '/removeImages',
      config: {
        handler: (req, res) => {
          const { payload: { images } } = req;

          removeImagesFromList(images)
            .then(() => {
              res('Removed images.').code(200);
            });
        },
      },
    },
    {
      method: 'GET',
      path: '/stopPipeline/{runId}',
      config: {
        handler: (req, res) => {
          const { runId } = req.params;

          remotePipelineManager.stopPipeline('', runId);
          res('Stopped pipeline.').code(200);
        },
      },
    },
  ];
});
