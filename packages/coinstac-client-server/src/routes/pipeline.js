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

module.exports = manager.then(() => {
  return [
    {
      method: 'POST',
      path: '/pullImages',
      config: {
        handler: async (req, res) => {
          const { payload: { images } } = req;

          pullImagesFromList(images)
            .then(() => {
              res('Pulled images successfully').code(200);
            });
        },
      },
    },
    {
      method: 'POST',
      path: '/removeImages',
      config: {
        handler: async (req, res) => {
          const { payload: { images } } = req;

          removeImagesFromList(images)
            .then(() => {
              res('Removed images successfully').code(200);
            });
        },
      },
    },
  ];
});
