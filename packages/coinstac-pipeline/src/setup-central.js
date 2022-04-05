
const path = require('path');
const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const mqtt = require('mqtt');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuid } = require('uuid');
const mv = pify(require('mv'));
const { getFilesAndDirs, splitFilesFromStream } = require('./pipeline-manager-helpers');
const expressFileServerSetup = require('./express-file-server-setup');

async function setupCentral({
  cleanupPipeline,
  logger,
  activePipelines,
  remoteClients,
  mqttRemoteProtocol,
  mqttRemoteURL,
  mqttRemotePort,
  clientId,
  store,
  remotePort,
  debugProfileClient,
  mqttSubChannel,
}) {
  let mqttServer;
  const clientPublish = (clients, data, opts) => {
    Object.keys(clients).forEach((clientId) => {
      if (opts && opts.success && opts.limitOutputToOwner) {
        if (clientId === opts.owner) {
          mqttServer.publish(`${mqttSubChannel}${clientId}-run`, JSON.stringify(data), { qos: 0 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
        } else {
          const limitedData = Object.assign({}, data, { files: undefined, output: { success: true, output: { message: 'output sent to consortium owner' } } });
          mqttServer.publish(`${mqttSubChannel}${clientId}-run`, JSON.stringify(limitedData), { qos: 0 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
        }
      } else {
        mqttServer.publish(`${mqttSubChannel}${clientId}-run`, JSON.stringify(data), { qos: 1 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
      }
    });
  };

  function waitingOnForRun(runId) {
    const waiters = [];
    Object.keys(activePipelines[runId].clients).forEach((clientId) => {
      const clientRun = remoteClients[clientId][runId];
      if ((clientRun
        && !store.has(runId, clientId))
        // test if we have all files, if there are any
        || (clientRun
          && (clientRun.files.expected.length !== 0
            && !clientRun.files.expected
              .every(e => clientRun.files.received.includes(e))
          )
        )) {
        waiters.push(clientId);
      }
    });

    return waiters;
  }

  function clearClientFileList(runId) {
    Object.keys(remoteClients).forEach((clientId) => {
      if (remoteClients[clientId][runId]) {
        remoteClients[clientId][runId].files = { received: [], expected: [] };
      }
    });
  }

  function printClientTimeProfiling(runId, task) {
    Object.keys(activePipelines[runId].clients).forEach((clientId) => {
      const currentClient = remoteClients[clientId][runId];
      if (currentClient) {
        const time = currentClient.debug.received - currentClient.debug.sent;
        currentClient.debug.profiling[task] = currentClient.debug.profiling[task]
          ? currentClient.debug.profiling[task] + time : time;
        debugProfileClient(`${task} took ${clientId}: ${time}ms`);
      }
    });
  }

  async function communicate(pipeline, success, messageIteration) {
    const message = store.getAndRemove(pipeline.id, clientId);
    if (message instanceof Error) {
      const runError = Object.assign(
        message,
        {
          error: `Pipeline error from central node\n Error details: ${message.error}`,
          message: `Pipeline error from central node\n Error details: ${message.message}`,
          stack: message.stack,
        }
      );
      activePipelines[pipeline.id].state = 'error';
      activePipelines[pipeline.id].stateStatus = 'Central node error';
      activePipelines[pipeline.id].error = runError;
      activePipelines[pipeline.id].remote.reject(runError);
      clientPublish(
        activePipelines[pipeline.id].clients,
        { runId: pipeline.id, error: runError }
      );
    } else {
      logger.silly('############ Sending out remote data');
      await getFilesAndDirs(activePipelines[pipeline.id].transferDirectory)
        .then((data) => {
          return Promise.all([
            ...data.files.map((file) => {
              return mv(
                path.join(activePipelines[pipeline.id].transferDirectory, file),
                path.join(activePipelines[pipeline.id].systemDirectory, file)
              );
            }),
            ...data.directories.map((dir) => {
              return mv(
                path.join(activePipelines[pipeline.id].transferDirectory, dir),
                path.join(activePipelines[pipeline.id].systemDirectory, dir),
                { mkdirp: true }
              );
            }),
          ]).then(() => data);
        })
        .then((data) => {
          if (data && (data.files.length !== 0 || data.directories.length !== 0)) {
            const archive = archiver('tar', {
              gzip: true,
              gzipOptions: {
                level: 9,
              },
            });
            const archiveFilename = `${pipeline.id}-${uuid()}-tempOutput.tar.gz`;
            const splitProm = splitFilesFromStream(
              archive, // stream
              path.join(activePipelines[pipeline.id].systemDirectory, archiveFilename),
              22428800 // 20MB chunk size
            );
            data.files.forEach((file) => {
              archive.append(
                fs.createReadStream(
                  path.join(activePipelines[pipeline.id].systemDirectory, file)
                ),
                { name: file }
              );
            });
            data.directories.forEach((dir) => {
              archive.directory(
                path.join(activePipelines[pipeline.id].systemDirectory, dir),
                dir
              );
            });
            archive.finalize();
            return splitProm.then((files) => {
              if (success) {
                activePipelines[pipeline.id].finalTransferList = new Set();
              }
              clientPublish(
                activePipelines[pipeline.id].clients,
                {
                  runId: pipeline.id,
                  output: message,
                  success,
                  files: [...files],
                  iteration: messageIteration,
                  debug: { sent: Date.now() },
                },
                {
                  success,
                  limitOutputToOwner: activePipelines[pipeline.id].limitOutputToOwner,
                  owner: activePipelines[pipeline.id].owner,
                }
              );
            });
          }
          clientPublish(
            activePipelines[pipeline.id].clients,
            {
              runId: pipeline.id,
              output: message,
              success,
              iteration: messageIteration,
              debug: { sent: Date.now() },
            },
            {
              success,
              limitOutputToOwner: activePipelines[pipeline.id].limitOutputToOwner,
              owner: activePipelines[pipeline.id].owner,
            }
          );
        }).catch((e) => {
          logger.error(e);
          clientPublish('run', {
            id: clientId,
            runId: pipeline.id,
            error: `Error from central node ${e}`,
            debug: { sent: Date.now() },
          });
        });
    }
  }

  async function mqttSetup() {
    logger.silly('Starting remote pipeline manager');
    const mqttServer = mqtt.connect(
      `${mqttRemoteProtocol}//${mqttRemoteURL}:${mqttRemotePort}`,
      {
        clientId: `${clientId}_${Math.random().toString(16).substr(2, 8)}`,
        reconnectPeriod: 5000,
        clean: false,
      }
    );
    await new Promise((resolve) => {
      mqttServer.on('connect', () => {
        logger.silly(`mqtt connection up ${clientId}`);
        mqttServer.subscribe(`${mqttSubChannel}register`, { qos: 1 }, (err) => {
          resolve();
          if (err) logger.error(`Mqtt error: ${err}`);
        });
        mqttServer.subscribe(`${mqttSubChannel}run`, { qos: 1 }, (err) => {
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
            return mqttServer.publish(`${mqttSubChannel}${id}-run`, JSON.stringify({ runId, error: 'Remote has no such pipeline run' }));
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
                    stack: error.stack,
                  }
                );
              }
              activePipelines[runId].stateStatus = 'Received client error';
              activePipelines[runId].error = runError;
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
            mqttServer.publish(`${mqttSubChannel}${id}-register`, JSON.stringify({ runId }));
            remoteClients[id].state = 'registered';
            logger.silly(`MQTT registered: ${id}`);
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

  await expressFileServerSetup({
    activePipelines,
    remoteClients,
    waitingOnForRun,
    logger,
    clearClientFileList,
    clientPublish,
    remotePort,
    printClientTimeProfiling,
  });
  mqttServer = await mqttSetup();


  return {
    mqttServer,
    communicate,
    waitingOnForRun,
    clientPublish,
  };
}

module.exports = setupCentral;
