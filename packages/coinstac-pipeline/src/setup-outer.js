const mqtt = require('mqtt');
const path = require('path');
const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const fs = require('fs');
const archiver = require('archiver');
const mv = pify(require('mv'));
const { splitFilesFromStream, extractTar, getFilesAndDirs } = require('./pipeline-manager/helpers');

const {
  unlink,
} = fs.promises;

async function stupOuter({
  logger,
  mqttRemoteProtocol,
  mqttRemoteURL,
  mqttRemotePort,
  clientId,
  mqttRemoteWSProtocol,
  mqttRemoteWSPort,
  mqttRemoteWSPathname,
  activePipelines,
  debugProfileClient,
  transferFiles,
  store,
}) {
  let mqttClient;
  const publishData = (key, data, qos = 0) => {
    mqttClient.publish(
      key,
      JSON.stringify(data),
      { qos },
      (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
    );
  };

  async function communicate(pipeline, success, messageIteration) {
    const message = store.getAndRemove(pipeline.id, clientId);
    if (message instanceof Error) { // eslint-disable-line no-lonely-if
      if (!activePipelines[pipeline.id].registered) {
        activePipelines[pipeline.id].stashedOutput = message;
      } else {
        publishData('run', {
          id: clientId,
          runId: pipeline.id,
          error: message,
          debug: { sent: Date.now() },
        });
        activePipelines[pipeline.id].stashedOutput = undefined;
      }
    } else {
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
            if (!activePipelines[pipeline.id].registered) {
              activePipelines[pipeline.id].stashedOutput = message;
            } else {
              const archive = archiver('tar', {
                gzip: true,
                gzipOptions: {
                  level: 9,
                },
              });

              const archiveFilename = `${pipeline.id}-${clientId}-tempOutput.tar.gz`;
              const splitProm = splitFilesFromStream(
                archive,
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
                logger.debug('############# Local client sending out data with files');
                publishData('run', {
                  id: clientId,
                  runId: pipeline.id,
                  output: message,
                  files: [...files],
                  iteration: messageIteration,
                  debug: { sent: Date.now() },
                });
                activePipelines[pipeline.id].stashedOutput = undefined;
                transferFiles(
                  'post',
                  100,
                  [...files],
                  clientId,
                  pipeline.id,
                  activePipelines[pipeline.id].systemDirectory
                ).catch((e) => {
                  // files failed to send, bail
                  logger.error(`Client file send error: ${e}`);
                  publishData('run', {
                    id: clientId,
                    runId: pipeline.id,
                    error: { stack: e.stack, message: e.message },
                    debug: { sent: Date.now() },
                  }, 1);
                });
              }).catch((e) => {
                publishData('run', {
                  id: clientId,
                  runId: pipeline.id,
                  error: e,
                  debug: { sent: Date.now() },
                });
                throw e;
              });
            }
          } else {
            if (!activePipelines[pipeline.id].registered) { // eslint-disable-line no-lonely-if, max-len
              activePipelines[pipeline.id].stashedOutput = message;
            } else {
              logger.debug('############# Local client sending out data');
              publishData('run', {
                id: clientId,
                runId: pipeline.id,
                output: message,
                iteration: messageIteration,
                debug: { sent: Date.now() },
              }, 1);
              activePipelines[pipeline.id].stashedOutput = undefined;
            }
          }
        })
        .catch((e) => {
          publishData('run', {
            id: clientId,
            runId: pipeline.id,
            error: e,
            debug: { sent: Date.now() },
          });
          throw e;
        });
    }
  }


  async function mqqttSetup() {
    let clientInit = false;
    logger.silly('Starting local pipeline manager');
    const getMqttConn = () => {
      return new Promise((resolve, reject) => {
        const client = mqtt.connect(
          `${mqttRemoteProtocol}//${mqttRemoteURL}:${mqttRemotePort}`,
          {
            clientId: `${clientId}_${Math.random().toString(16).substr(2, 8)}`,
            reconnectPeriod: 5000,
            connectTimeout: 15 * 1000,
          }
        );
        client.on('offline', () => {
          if (!clientInit) {
            client.end(true, () => {
              reject(new Error('MQTT_OFFLINE'));
            });
          }
        });
        client.on('connect', () => {
          clientInit = true;
          logger.silly(`mqtt connection up ${clientId}`);
          client.subscribe(`${clientId}-register`, { qos: 0 }, (err) => {
            if (err) logger.error(`Mqtt error: ${err}`);
          });
          client.subscribe(`${clientId}-run`, { qos: 0 }, (err) => {
            if (err) logger.error(`Mqtt error: ${err}`);
          });
          resolve(client);
        });
      }).catch((e) => {
        if (e.message === 'MQTT_OFFLINE') {
          return new Promise((resolve) => {
            logger.error('MQTT connection down trying WS/S');
            const client = mqtt.connect(
              `${mqttRemoteWSProtocol}//${mqttRemoteURL}:${mqttRemoteWSPort}${mqttRemoteWSPathname}`,
              {
                clientId: `${clientId}_${Math.random().toString(16).substr(2, 8)}`,
                reconnectPeriod: 5000,
              }
            );
            client.on('connect', () => {
              clientInit = true;
              logger.silly(`mqtt connection up ${clientId}`);
              client.subscribe(`${clientId}-register`, { qos: 0 }, (err) => {
                if (err) logger.error(`Mqtt error: ${err}`);
              });
              client.subscribe(`${clientId}-run`, { qos: 0 }, (err) => {
                if (err) logger.error(`Mqtt error: ${err}`);
              });
              resolve(client);
            });
            resolve(client);
          });
        }
        throw e;
      });
    };

    mqttClient = await getMqttConn();

    mqttClient.on('message', async (topic, dataBuffer) => {
      const received = Date.now();
      const data = JSON.parse(dataBuffer);
      // TODO: step check?
      switch (topic) {
        case `${clientId}-run`:
          if (!data.error && activePipelines[data.runId]) {
            if (activePipelines[data.runId].pipeline.currentState.currentIteration
              !== data.iteration
            ) {
              logger.silly(`Duplicate message client ${data.id}`);
              return;
            }
            activePipelines[data.runId].stateStatus = 'received central node data';
            logger.silly('received central node data');
            debugProfileClient(`Transmission to ${clientId} took the remote: ${Date.now() - data.debug.sent}ms`);

            let error;
            if (data.files) {
              try {
                const workDir = data.success
                  ? activePipelines[data.runId].outputDirectory
                  : activePipelines[data.runId].baseDirectory;
                const paths = await transferFiles('get', 300, data.files, clientId, data.runId, workDir);
                const fullPathFiles = paths
                  .map(p => path.join(workDir, p));
                await extractTar(fullPathFiles, workDir);
                await Promise.all(fullPathFiles.map(f => unlink(f)));
              } catch (e) {
                error = e;
              }
            }
            if (data.success && data.files) {
              // let the remote know we have the files
              publishData('finished', {
                id: clientId,
                runId: data.runId,
              });
            }

            if (error) {
              if (data.success) throw error;
              publishData('run', {
                id: clientId,
                runId: data.runId,
                error: { stack: error.stack, message: error.message },
              });
              activePipelines[data.runId].remote.reject(error);
            } else {
              store.put(data.runId, clientId, data.output);
              // why is this resolve in a promise? It's a terrible hack to
              // keep docker happy mounting the transfer dir. If there are comp
              // issues writing to it, this is the place to look
              await rmrf(path.join(activePipelines[data.runId].systemDirectory, '*'))
                .then(() => {
                  activePipelines[data.runId].remote.resolve(
                    { debug: { received }, success: data.success }
                  );
                });
            }
          } else if (data.error && activePipelines[data.runId]) {
            activePipelines[data.runId].state = 'error';
            activePipelines[data.runId].stateStatus = 'Received error';
            activePipelines[data.runId].remote.reject(Object.assign(new Error(), data.error));
          }

          break;
        case `${clientId}-register`:
          if (activePipelines[data.runId]) {
            if (activePipelines[data.runId].registered) break;
            activePipelines[data.runId].registered = true;
            if (activePipelines[data.runId].stashedOutput) {
              communicate(
                activePipelines[data.runId].pipeline,
                activePipelines[data.runId].stashedOutput,
                activePipelines[data.runId].pipeline.currentState.currentIteration
              );
            }
          }
          break;
        default:
      }
    });
    return mqttClient;
  }


  mqttClient = await mqqttSetup();

  return { mqttClient, communicate, publishData };
}

module.exports = stupOuter;
