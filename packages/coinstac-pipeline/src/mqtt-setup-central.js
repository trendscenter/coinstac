const express = require('express');
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const fs = require('fs');
const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const mqtt = require('mqtt');
const { extractTar } = require('./pipeline-manager/helpers');

const {
  unlink,
} = fs.promises;


async function mqqtSetupCentral({
  logger,
  activePipelines,
  remoteClients,
  waitingOnForRun,
  clearClientFileList,
  printClientTimeProfiling,
  clientPublish,
  mqttServer,
  remotePort,
  cleanupPipeline,
  mqttRemoteProtocol,
  mqttRemoteURL,
  mqttRemotePort,
  clientId,
  store,
}) {
  logger.silly('Starting remote pipeline manager');
  /**
   * express file server setup
   */
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fp = path.join(activePipelines[req.body.runId].baseDirectory, req.body.clientId);
      mkdirp(fp)
        .then(() => {
          cb(
            null,
            fp
          );
        });
    },
    filename: (req, file, cb) => {
      cb(null, req.body.filename);
    },
  });

  const upload = multer({ storage });
  const app = express();
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb' }));

  app.post('/transfer', upload.single('file'), (req, res) => {
    const received = Date.now();
    res.end();
    const { clientId, runId } = req.body;
    const client = remoteClients[clientId][runId];


    Promise.resolve().then(() => {
      // is this file the last?
      if (client.files.expected.length !== 0
        && client.files.expected
          .every(e => [req.body.filename, ...client.files.received].includes(e))) {
        remoteClients[clientId][runId].debug.received = Date.now();
        const workDir = path.join(
          activePipelines[runId].baseDirectory,
          clientId
        );
        const tars = client.files.expected
          .map(file => path.join(workDir, file))
          .sort((a, b) => parseInt(path.extname(a), 10) > parseInt(path.extname(b), 10));
        return extractTar(tars, workDir)
          .then(() => Promise.all(tars.map(tar => unlink(tar))));
      }
    }).then(() => {
      // we add the file here, otherwise there can be a race condition
      // with multiple clients untaring
      client.files.received
        .push(req.body.filename);
      const waitingOn = waitingOnForRun(runId);
      activePipelines[runId].currentState.waitingOn = waitingOn;
      const stateUpdate = Object.assign(
        {},
        activePipelines[runId].pipeline.currentState,
        activePipelines[runId].currentState
      );
      activePipelines[runId].stateEmitter
        .emit('update', stateUpdate);
      logger.silly(JSON.stringify(stateUpdate));
      if (waitingOn.length === 0) {
        activePipelines[runId].stateStatus = 'Received all nodes data and files';
        logger.silly('Received all nodes data and files');
        // clear transfer and start run
        clearClientFileList(runId);
        rmrf(path.join(activePipelines[runId].systemDirectory, '*'))
          .then(() => {
            printClientTimeProfiling(runId, 'Transmission with files');
            activePipelines[runId].remote
              .resolve({ debug: { received }, success: false });
          });
      }
    }).catch((error) => {
      const runError = Object.assign(
        error,
        {
          error: `Pipeline error from pipeline central node, Error details: ${error.error}`,
          message: `Pipeline error from pipeline central node, Error details: ${error.message}`,
        }
      );
      activePipelines[runId].state = 'error';
      activePipelines[runId].stateStatus = 'Received node error';
      activePipelines[runId].error = runError;
      clientPublish(
        activePipelines[runId].clients,
        { runId, error: runError }
      );
      activePipelines[runId].remote.reject(runError);
    });
  });

  app.get('/transfer', (req, res) => {
    const file = path.join(
      activePipelines[req.query.runId].systemDirectory,
      req.query.file
    );
    fs.exists(file, (exists) => {
      if (exists) {
        res.download(file);
      } else {
        res.sendStatus(404);
      }
    });
  });
  await new Promise((resolve) => {
    const server = app.listen(remotePort, () => {
      logger.silly(`File server up on port ${remotePort}`);
      resolve();
    });
    server.on('error', (e) => {
      logger.error(`File server error: ${e}`);
    });
  });

  /**
   * mqtt server-side setup
   */
  mqttServer = mqtt.connect(
    `${mqttRemoteProtocol}//${mqttRemoteURL}:${mqttRemotePort}`,
    {
      clientId: `${clientId}_${Math.random().toString(16).substr(2, 8)}`,
      reconnectPeriod: 5000,
    }
  );
  await new Promise((resolve) => {
    mqttServer.on('connect', () => {
      logger.silly(`mqtt connection up ${clientId}`);
      mqttServer.subscribe('register', { qos: 0 }, (err) => {
        resolve();
        if (err) logger.error(`Mqtt error: ${err}`);
      });
      mqttServer.subscribe('run', { qos: 0 }, (err) => {
        if (err) logger.error(`Mqtt error: ${err}`);
      });
    });
  });

  mqttServer.on('message', (topic, dataBuffer) => {
    const received = Date.now();
    const data = JSON.parse(dataBuffer);
    const {
      id, runId, output, error, files,
    } = data;
    switch (topic) {
      case 'run':
        logger.silly(`############ Received client data: ${id}`);
        if (!activePipelines[runId] || !remoteClients[id]) {
          return mqttServer.publish(`${id}-run`, JSON.stringify({ runId, error: new Error('Remote has no such pipeline run') }));
        }

        // normal pipeline operation
        if (remoteClients[id] && remoteClients[id][runId]) {
          // is the client giving us an error?
          if (!error) {
            remoteClients[id][runId].debug.received = Date.now();
            remoteClients[id][runId].debug.sent = data.debug.sent;
            // has this pipeline error'd out?
            if (!activePipelines[runId].error) {
              // check if the msg is a dup, either for a current or past iteration
              if (store.has(runId, id)
                || activePipelines[runId].pipeline.currentState.currentIteration + 1
                !== data.iteration
              ) {
                logger.silly(`Duplicate message client ${id}`);
                return;
              }
              store.put(runId, id, output);

              if (files) {
                remoteClients[id][runId].files.expected.push(...files);
              }
              if (activePipelines[runId].state !== 'pre-pipeline') {
                const waitingOn = waitingOnForRun(runId);
                activePipelines[runId].currentState.waitingOn = waitingOn;
                const stateUpdate = Object.assign(
                  {},
                  activePipelines[runId].pipeline.currentState,
                  activePipelines[runId].currentState
                );
                activePipelines[runId].stateEmitter
                  .emit('update', stateUpdate);
                logger.silly(JSON.stringify(stateUpdate));
                if (waitingOn.length === 0) {
                  activePipelines[runId].stateStatus = 'Received all node data';
                  logger.silly('Received all node data');
                  // clear transfer and start run
                  clearClientFileList(runId);
                  rmrf(path.join(activePipelines[runId].systemDirectory, '*'))
                    .then(() => {
                      printClientTimeProfiling(runId, 'Transmission');
                      activePipelines[runId].remote
                        .resolve({ debug: { received }, success: false });
                    });
                }
              }
            } else {
              clientPublish(
                activePipelines[runId].clients,
                { runId, error: activePipelines[runId].error }
              );
            }
          } else {
            let runError;
            if (!error && !output) {
              runError = new Error('Malformed client output');
            } else {
              runError = Object.assign(
                error,
                {
                  error: `Pipeline error from pipeline ${runId} user: ${activePipelines[runId].clients[id]}\n Error details: ${error.error}`,
                  message: `Pipeline error from pipeline ${runId} user: ${activePipelines[runId].clients[id]}\n Error details: ${error.message}`,
                }
              );
            }
            activePipelines[runId].stateStatus = 'Received client error';
            activePipelines[runId].error = runError;
            clientPublish(
              activePipelines[runId].clients,
              { runId, error: runError }
            );
            activePipelines[runId].remote.reject(runError);
          }
        }
        break;
      case 'register':
        if (!activePipelines[runId] || activePipelines[runId].state === 'created') {
          remoteClients[id] = Object.assign(
            {
              id,
              state: 'pre-registered',
              [runId]: {
                state: {},
                files: { expected: [], received: [] },
                debug: { profiling: {} },
              },

            },
            remoteClients[id]
          );
        } else {
          mqttServer.publish(`${id}-register`, JSON.stringify({ runId }));
          remoteClients[id].state = 'registered';
        }
        break;
      case 'finished':
        if (activePipelines[runId] && activePipelines[runId].clients[id]) {
          if (activePipelines[runId].finalTransferList) {
            activePipelines[runId].finalTransferList.add(id);
            if (Object.keys(activePipelines[runId].clients)
              .every(clientId => activePipelines[runId].finalTransferList.has(clientId))
              || (
                activePipelines[runId].limitOutputToOwner
                && id === activePipelines[runId].owner
              )
            ) {
              cleanupPipeline(runId)
                .catch(e => logger.error(`Pipeline cleanup failure: ${e}`));
            }
          }
        }
        break;
      default:
    }
  });
  return mqttServer;
}

module.exports = mqqtSetupCentral;
