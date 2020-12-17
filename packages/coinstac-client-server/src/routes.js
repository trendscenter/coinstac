const path = require('path');
const axios = require('axios');
const PipelineManager = require('coinstac-pipeline');
const { pullImagesFromList, removeImagesFromList } = require('coinstac-manager');

const Managers = {};

async function getDockerManager(clientId) {
  if (Managers[clientId]) {
    return Managers[clientId];
  }

  const manager = await PipelineManager.create({
    mode: 'local',
    clientId,
    operatingDirectory: path.resolve(process.env.PIPELINE_SERVER_OPERARTING_DIR, 'coinstac'),
    remotePort: 3400,
    mqttRemotePort: process.env.MQTT_SERVER_PORT,
    mqttRemoteProtocol: process.env.MQTT_SERVER_PROTOCOL,
    mqttRemoteURL: process.env.MQTT_SERVER_HOSTNAME,
  });

  return manager;
}

const validateToken = async (req, h) => {
  const { headers: { authorization } } = req;

  if (!authorization) {
    return h.response('Invalid token.').code(400).takeover();
  }

  const apiServer = `http://${process.env.API_SERVER_HOSTNAME}:${process.env.API_SERVER_PORT}`;

  try {
    await axios.post(`${apiServer}/authenticateByToken`, null, { headers: { Authorization: authorization } });
    return true;
  } catch {
    return h.response('Invalid token.').code(400).takeover();
  }
};

module.exports = (server) => {
  return [
    {
      method: 'POST',
      path: '/pullImages',
      options: {
        pre: [
          { method: validateToken },
        ],
        handler: async (req, h) => {
          try {
            const { payload: { images } } = req;

            await pullImagesFromList(images);
            return h.response('Pulled images.').code(200);
          } catch (error) {
            return h.response(error.message).code(400);
          }
        },
      },
    },
    {
      method: 'POST',
      path: '/removeImages',
      options: {
        pre: [
          { method: validateToken },
        ],
        handler: async (req, h) => {
          try {
            const { payload: { images } } = req;

            await removeImagesFromList(images);
            return h.response('Removed images.').code(200);
          } catch (error) {
            return h.response(error.message).code(400);
          }
        },
      },
    },
    {
      method: 'POST',
      path: '/startPipeline/{clientId}',
      options: {
        pre: [
          { method: validateToken },
        ],
        handler: async (req, h) => {
          try {
            const { payload: { run }, params: { clientId } } = req;
            const { runId } = run;

            let subscribed = false;
            const dataQueue = [];

            const subscriptionURL = `/pipelineResult/${runId}`;

            function publishData() { // eslint-disable-line no-inner-declarations
              if (!subscribed) {
                return;
              }

              while (dataQueue.length) {
                server.publish(subscriptionURL, dataQueue.pop());
              }
            }

            server.subscription(subscriptionURL, {
              onSubscribe: () => {
                subscribed = true;
                publishData();
              },
              onUnsubscribe: () => {
                subscribed = false;
              },
            });

            const remotePipelineManager = await getDockerManager(clientId);

            const computationImageList = run.pipelineSnapshot.steps
              .map(step => step.computations
                .map(comp => comp.computation.dockerImage))
              .reduce((acc, val) => acc.concat(val), []);

            await pullImagesFromList(computationImageList);

            const managerResponse = remotePipelineManager.startPipeline({
              clients: run.clients,
              spec: run.pipelineSnapshot,
              runId,
              timeout: run.timeout,
            });

            const { pipeline, result, stateEmitter } = managerResponse;

            stateEmitter.on('update', (data) => {
              dataQueue.push({ runId, data, event: 'update' });
              publishData();
            });

            result
              .then((result) => {
                dataQueue.push({ runId, data: result, event: 'result' });
                publishData();
              })
              .catch((error) => {
                dataQueue.push({ runId, data: error, event: 'error' });
                publishData();
              });

            return h.response({ pipeline }).code(201);
          } catch (error) {
            return h.response(error.message).code(400);
          }
        },
      },
    },
    {
      method: 'PATCH',
      path: '/stopPipeline/{clientId}/{runId}',
      options: {
        pre: [
          { method: validateToken },
        ],
        handler: async (req, h) => {
          const { clientId, runId } = req.params;

          try {
            await validateToken(req.headers.authorization);

            const remotePipelineManager = await getDockerManager(clientId, runId);

            await remotePipelineManager.stopPipeline('', runId);
            return h.response('Stopped pipeline.').code(200);
          } catch (error) {
            return h.response(error.message).code(400);
          }
        },
      },
    },
  ];
};
