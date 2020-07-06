const path = require('path');
const PipelineManager = require('coinstac-pipeline');
const { pullImagesFromList, removeImagesFromList } = require('coinstac-docker-manager');

const config = require('./config');

const DELAY = 5000;

const dockerManagers = {};

async function getDockerManager(clientId) {
  if (dockerManagers[clientId]) {
    return dockerManagers[clientId];
  }

  const manager = await PipelineManager.create({
    mode: 'local',
    clientId,
    operatingDirectory: path.resolve(config.operatingDirectory, 'coinstac'),
    remotePort: 3400,
    mqttRemotePort: config.mqttServer.port,
    mqttRemoteProtocol: config.mqttServer.protocol,
    mqttRemoteURL: config.mqttServer.hostname,
  });

  return manager;
}

module.exports = (server) => {
  return [
    {
      method: 'POST',
      path: '/pullImages',
      handler: async (req, h) => {
        const { payload: { images } } = req;

        try {
          await pullImagesFromList(images);
          return h.response('Pulled images.').code(200);
        } catch (error) {
          return h.response(error.message).code(400);
        }
      },
    },
    {
      method: 'POST',
      path: '/removeImages',
      handler: async (req, h) => {
        const { payload: { images } } = req;

        try {
          await removeImagesFromList(images);
          return h.response('Removed images.').code(200);
        } catch (error) {
          return h.response(error.message).code(400);
        }
      },
    },
    {
      method: 'POST',
      path: '/startPipeline/{clientId}',
      handler: async (req, h) => {
        const { clientId } = req.params;

        const remotePipelineManager = await getDockerManager(clientId);

        const { payload: { run } } = req;
        const computationImageList = run.pipelineSnapshot.steps
          .map(step => step.computations
            .map(comp => comp.computation.dockerImage))
          .reduce((acc, val) => acc.concat(val), []);

        await pullImagesFromList(computationImageList);

        const { runId } = run;

        const managerResponse = remotePipelineManager.startPipeline({
          clients: run.clients,
          spec: run.pipelineSnapshot,
          runId,
          timeout: run.timeout,
        });

        const { pipeline, result, stateEmitter } = managerResponse;

        function publishData(data) {
          setTimeout(() => {
            server.publish('/pipelineResult', data);
          }, DELAY);
        }

        stateEmitter.on('update', (data) => {
          publishData({ runId, data, event: 'update' });
        });

        result
          .then((result) => {
            publishData({ runId, data: result, event: 'result' });
          })
          .catch((error) => {
            publishData({ runId, data: error, event: 'error' });
          });

        return h.response({ pipeline }).code(201);
      },
    },
    {
      method: 'GET',
      path: '/stopPipeline/{clientId}/{runId}',
      handler: async (req, h) => {
        const { clientId, runId } = req.params;

        try {
          const remotePipelineManager = await getDockerManager(clientId, runId);

          await remotePipelineManager.stopPipeline('', runId);
          return h.response('Stopped pipeline.').code(200);
        } catch (error) {
          return h.response(error.message).code(400);
        }
      },
    },
  ];
};
