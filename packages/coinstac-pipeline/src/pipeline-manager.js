'use strict';

const fs = require('fs');
const _ = require('lodash');
const mqtt = require('mqtt');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const rimraf = promisify(require('rimraf'));
const path = require('path');
const http = require('http');
const https = require('https');
const FormData = require('form-data');
const archiver = require('archiver');
const Emitter = require('events');
const winston = require('winston');
const express = require('express');
const multer = require('multer');
const decompress = require('decompress');
const uuid = require('uuid/v4');
const dockerManager = require('coinstac-docker-manager');

const readdir = promisify(fs.readdir);

winston.loggers.add('pipeline', {
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
const defaultLogger = winston.loggers.get('pipeline');
defaultLogger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';

const Pipeline = require('./pipeline');

/**
 * get files in a dir recursively
 * https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
 * @param  {string}  dir dir path
 * @return {Promise}     files
 */
const getFilesAndDirs = async (dir) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  return dirents.reduce((memo, dirent) => {
    if (dirent.isDirectory()) {
      memo.directories.push(dirent.name);
    } else {
      memo.files.push(dirent.name);
    }
    return memo;
  }, { files: [], directories: [] });
};

module.exports = {

  /**
   * A pipeline manager factory, returns a manager in either a remote or local operating
   * mode that then can run and manipulate pipelines.
   * @param  {String} mode                     either local or remote
   * @param  {String} clientId                 the unique ID that identifies this manager
   * @param  {String} [operatingDirectory='./'] the operating directory
   *                                              for results and other file IO
   * @return {Object}                          A pipeline manager
   */
  async create({
    clientId,
    logger,
    operatingDirectory = './',
    mode,
    remotePathname = '/transfer',
    remotePort = 3300,
    remoteProtocol = 'http:',
    mqttRemotePort = 1883,
    mqttRemoteProtocol = 'mqtt:',
    remoteURL = 'localhost',
    mqttRemoteURL = 'localhost',
    unauthHandler, // eslint-disable-line no-unused-vars
  }) {
    const activePipelines = {};
    let io;
    let socket;
    let mqtCon;
    let serverMqt;
    const remoteClients = {};
    const request = remoteProtocol.trim() === 'https:' ? https : http;
    logger = logger || defaultLogger;

    /**
     * exponential backout for GET
     * consider file batching here if server load is too high
     */
    const exponentialRequest = (
      method,
      factor,
      file,
      clientId,
      runId,
      directory,
      compressed = false,
      files = []
    ) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (method === 'get') {
            request.get(
              `${remoteProtocol}//${remoteURL}:${remotePort}${remotePathname}?id=${encodeURIComponent(clientId)}&runId=${encodeURIComponent(runId)}&file=${encodeURIComponent(file)}&files=${encodeURIComponent(JSON.stringify(files))}`,
              (res) => {
                if (res.statusCode !== 200) {
                  return reject(new Error(`File post error: ${res.statusCode} ${res.statusMessage}`));
                }
                const wstream = fs.createWriteStream(
                  path.join(directory, file)
                );
                res.pipe(wstream);
                wstream.on('close', () => {
                  resolve(file);
                });
                wstream.on('error', (e) => {
                  reject(e);
                });
                res.on('error', (e) => {
                  reject(e);
                });
              }
            );
          } else if (method === 'post') {
            const form = new FormData();
            form.append('filename', file);
            form.append('compressed', compressed.toString());
            form.append('files', JSON.stringify(files));
            form.append('clientId', clientId);
            form.append('runId', runId);
            form.append('file', fs.createReadStream(
              path.join(directory, file)
            ));
            form.submit(`${remoteProtocol}//${remoteURL}:${remotePort}${remotePathname}`,
              (err, res) => {
                if (err) return reject(err);
                res.resume();
                res.on('end', () => {
                  if (!res.complete) {
                    return reject(new Error('File post connection broken'));
                  }
                  if (res.statusCode !== 200) {
                    return reject(new Error(`File post error: ${res.statusCode} ${res.statusMessage}`));
                  }
                  resolve();
                });
                res.on('error', (e) => {
                  reject(e);
                });
              });
          }
        }, 500 * factor);
      });
    };

    /**
     *  transfer a file to or from the remote
     * @param  {string} method   POST or GET
     * @param  {integer} limit   retry limit for an unreachable host
     * @param  {Array} files     files to send or recieve
     * @param  {string} clientId this clients id
     * @param  {string} runId    the run context for the files
     * @return {Promise}         Promise when the files are received,
     *                           the action fails besides ECONNREFUSED,
     *                           or the limit is reached
     */
    const transferFiles = async (method, limit, files, clientId, runId, directory) => {
      return Promise.all(files.reduce((memo, file) => {
        memo.push((async () => {
          let retryLimit = 0;
          let success = false;
          // retry 1000 times w/ backout
          while (retryLimit < limit) {
            try {
              const packedFile = await exponentialRequest( // eslint-disable-line no-await-in-loop, max-len
                method,
                retryLimit,
                file,
                clientId,
                runId,
                directory,
                true
              );
              if (method === 'get' && packedFile) {
                await decompress(path.join(directory, packedFile), directory); // eslint-disable-line no-await-in-loop, max-len
                await rimraf(path.join(directory, packedFile)); // eslint-disable-line no-await-in-loop, max-len
              }
              success = true;
              break;
            } catch (e) {
              if (e.code && e.code === 'ECONNREFUSED') {
                retryLimit += 1;
                logger.silly(`Retrying file request: ${files}`);
                logger.silly(`File request failed with: ${e.name}`);
              }
              throw e;
            }
          }
          if (!success) throw new Error('Service down, file retry limit reached');
        })());
        return memo;
      }, []));
    };

    /**
     * Perform final cleanup on a specified pipeline
     * @param  {string} runId  id of the pipeline to clean
     * @return {Promise}       Promise on completion
     */
    const cleanupPipeline = (runId) => {
      return Promise.all([
        rimraf(path.resolve(activePipelines[runId].transferDirectory)),
        rimraf(path.resolve(activePipelines[runId].cacheDirectory)),
        rimraf(path.resolve(activePipelines[runId].systemDirectory)),
      ]).then(() => {
        delete activePipelines[runId];
        Object.keys(remoteClients).forEach((key) => {
          if (remoteClients[key][runId]) {
            delete remoteClients[key][runId];
          }
        });
      });
    };


    const clientPublish = (clientList, data, opts) => {
      clientList.forEach((client) => {
        if (opts && opts.success && opts.limitOutputToOwner) {
          if (client === opts.owner) {
            serverMqt.publish(`${client}-run`, JSON.stringify(data), { qos: 1 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
          } else {
            const limitedData = Object.assign({}, data, { files: undefined, output: { success: true, output: { message: 'output sent to consortium owner' } } });
            serverMqt.publish(`${client}-run`, JSON.stringify(limitedData), { qos: 1 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
          }
        } else {
          serverMqt.publish(`${client}-run`, JSON.stringify(data), { qos: 1 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
        }
      });
    };

    const waitingOnForRun = (runId) => {
      const waiters = [];
      activePipelines[runId].clients.forEach((client) => {
        const clientRun = remoteClients[client][runId];
        if ((clientRun
          && !clientRun.currentOutput)
        // test if we have all files, if there are any
          || (clientRun
            && (clientRun.files.expected.length !== 0
              && !clientRun.files.expected
                .every(e => clientRun.files.received.includes(e))
            )
          )
        ) {
          waiters.push(client);
        }
      });

      return waiters;
    };

    const aggregateRun = (runId) => {
      return _.reduce(remoteClients, (memo, client, id) => {
        if (client[runId]) {
          memo[id] = client[runId].currentOutput;
          client[runId].currentOutput = undefined;
          client[runId].files = { received: [], expected: [] };
        }
        return memo;
      }, {});
    };

    // TODO: secure socket layer
    if (mode === 'remote') {
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

      app.post('/transfer', upload.single('file'), (req, res) => {
        res.end();

        // check to see if we can run
        let prom = Promise.resolve();
        if (req.body.compressed === 'true') {
          prom = decompress(
            path.join(
              activePipelines[req.body.runId].baseDirectory,
              req.body.clientId,
              req.body.filename
            ),
            path.join(activePipelines[req.body.runId].baseDirectory, req.body.clientId)
          );
        }
        prom.then(() => rimraf(
          path.join(
            activePipelines[req.body.runId].baseDirectory,
            req.body.clientId,
            req.body.filename
          )
        )).then(() => {
          remoteClients[req.body.clientId][req.body.runId].files.received
            .push(req.body.filename);
          const waitingOn = waitingOnForRun(req.body.runId);
          activePipelines[req.body.runId].currentState.waitingOn = waitingOn;
          const stateUpdate = Object.assign(
            {},
            activePipelines[req.body.runId].pipeline.currentState,
            activePipelines[req.body.runId].currentState
          );
          activePipelines[req.body.runId].stateEmitter
            .emit('update', stateUpdate);
          logger.silly(JSON.stringify(stateUpdate));
          if (waitingOn.length === 0) {
            activePipelines[req.body.runId].state = 'received all clients data';
            logger.silly('Received all client data');
            // clear transfer and start run
            activePipelines[req.body.runId].remote.resolve(
              rimraf(path.join(activePipelines[req.body.runId].transferDirectory, '*'))
                .then(() => ({ output: aggregateRun(req.body.runId) }))
            );
          }
        });
      });
      app.get('/transfer', (req, res) => {
        const file = path.join(
          activePipelines[req.query.runId].transferDirectory,
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
      serverMqt = mqtt.connect(
        `${mqttRemoteProtocol}//${mqttRemoteURL}:${mqttRemotePort}`,
        {
          clientId: `${clientId}_${Math.random().toString(16).substr(2, 8)}`,
          reconnectPeriod: 5000,
        }
      );
      await new Promise((resolve) => {
        serverMqt.on('connect', () => {
          logger.silly(`mqtt connection up ${clientId}`);
          serverMqt.subscribe('register', { qos: 1 }, (err) => {
            resolve();
            if (err) logger.error(`Mqtt error: ${err}`);
          });
          serverMqt.subscribe('run', { qos: 1 }, (err) => {
            if (err) logger.error(`Mqtt error: ${err}`);
          });
        });
      });

      serverMqt.on('message', (topic, dataBuffer) => {
        const data = JSON.parse(dataBuffer);
        switch (topic) {
          case 'run':
            logger.silly(`############ Received client data: ${data.id}`);
            if (!activePipelines[data.runId] || !remoteClients[data.id]) {
              return serverMqt.publish(`${data.id}-run`, JSON.stringify({ runId: data.runId, error: new Error('Remote has no such pipeline run') }));
            }

            // normal pipeline operation
            if (remoteClients[data.id] && remoteClients[data.id][data.runId]) {
              remoteClients[data.id].lastSeen = Math.floor(Date.now() / 1000);

              // is the client giving us an error?
              if (!data.error) {
                // has this pipeline error'd out?
                if (!activePipelines[data.runId].error) {
                  // check if the msg is a dup, either for a current or past iteration
                  if (remoteClients[data.id][data.runId].currentOutput
                    || activePipelines[data.runId].pipeline.currentState.currentIteration + 1
                    !== data.iteration
                  ) {
                    logger.silly(`Duplicate message client ${data.id}`);
                    return;
                  }
                  remoteClients[data.id][data.runId].currentOutput = data.output.output;
                  if (data.files) {
                    remoteClients[data.id][data.runId].files.expected.push(...data.files);
                  }
                  if (activePipelines[data.runId].state !== 'pre-pipeline') {
                    const waitingOn = waitingOnForRun(data.runId);
                    activePipelines[data.runId].currentState.waitingOn = waitingOn;
                    const stateUpdate = Object.assign(
                      {},
                      activePipelines[data.runId].pipeline.currentState,
                      activePipelines[data.runId].currentState
                    );
                    activePipelines[data.runId].stateEmitter
                      .emit('update', stateUpdate);
                    logger.silly(JSON.stringify(stateUpdate));
                    if (waitingOn.length === 0) {
                      activePipelines[data.runId].state = 'received all clients data';
                      logger.silly('Received all client data');
                      // clear transfer and start run
                      activePipelines[data.runId].remote.resolve(
                        rimraf(path.join(activePipelines[data.runId].transferDirectory, '*')).then(() => ({ output: aggregateRun(data.runId) }))
                      );
                    }
                  }
                } else {
                  clientPublish(
                    activePipelines[data.runId].clients,
                    { runId: data.runId, error: activePipelines[data.runId].error }
                  );
                }
              } else {
                const runError = Object.assign(
                  data.error,
                  {
                    error: `Pipeline error from pipeline ${data.runId} user: ${data.id}\n Error details: ${data.error.error}`,
                    message: `Pipeline error from pipeline ${data.runId} user: ${data.id}\n Error details: ${data.error.message}`,
                  }
                );
                activePipelines[data.runId].state = 'received client error';
                activePipelines[data.runId].error = runError;
                clientPublish(
                  activePipelines[data.runId].clients,
                  { runId: data.runId, error: runError }
                );
                activePipelines[data.runId].remote.reject(runError);
              }
            }
            break;
          case 'register':
            if (!activePipelines[data.runId] || activePipelines[data.runId].state === 'created') {
              remoteClients[data.id] = Object.assign(
                {
                  [data.runId]: { state: {}, files: { expected: [], received: [] } },
                  state: 'pre-registered',
                },
                remoteClients[data.id]
              );
            } else {
              serverMqt.publish(`${data.id}-register`, JSON.stringify({ runId: data.runId }));
              remoteClients[data.id].state = 'registered';
            }
            break;
          case 'finished':
            if (activePipelines[data.runId] && activePipelines[data.runId].clients[data.id]) {
              if (activePipelines[data.runId].finalTransferList) {
                activePipelines[data.runId].finalTransferList.add(data.id);
                if (activePipelines[data.runId].clients
                  .every(value => activePipelines[data.runId].finalTransferList.has(value))
                  || (
                    activePipelines[data.runId].limitOutputToOwner
                    && data.id === activePipelines[data.runId].owner
                  )
                ) {
                  cleanupPipeline(data.runId)
                    .catch(e => logger.error(`Pipeline cleanup failure: ${e}`));
                }
              }
            }
            break;
          default:
        }
      });
    } else {
      let clientInit = false;
      logger.silly('Starting local pipeline manager');
      mqtCon = mqtt.connect(
        `${mqttRemoteProtocol}//${mqttRemoteURL}:${mqttRemotePort}`,
        {
          clientId: `${clientId}_${Math.random().toString(16).substr(2, 8)}`,
          reconnectPeriod: 5000,
        }
      );

      await new Promise((resolve, reject) => {
        mqtCon.on('connect', () => {
          clientInit = true;
          logger.silly(`mqtt connection up ${clientId}`);
          mqtCon.subscribe(`${clientId}-register`, { qos: 1 }, (err) => {
            resolve();
            if (err) logger.error(`Mqtt error: ${err}`);
          });
          mqtCon.subscribe(`${clientId}-run`, { qos: 1 }, (err) => {
            if (err) logger.error(`Mqtt error: ${err}`);
          });
        });
        mqtCon.on('offline', () => {
          if (!clientInit) reject(new Error('MQTT connection down'));
        });
      });

      mqtCon.on('message', (topic, dataBuffer) => {
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
              activePipelines[data.runId].state = 'received central node data';
              logger.silly('received central node data');

              let preWork;
              if (data.files) {
                const workDir = data.output.success
                  ? activePipelines[data.runId].outputDirectory
                  : activePipelines[data.runId].baseDirectory;
                preWork = transferFiles('get', 1000, data.files, clientId, data.runId, workDir);
              } else {
                preWork = Promise.resolve();
              }
              // clear transfer dir after we know its been transfered
              preWork
                .then(() => {
                  rimraf(path.join(activePipelines[data.runId].transferDirectory, '*'));
                })
                .then(() => {
                  if (data.output.success && data.files) {
                    // let the remote know we have the files
                    mqtCon.publish(
                      'finished',
                      JSON.stringify(
                        {
                          id: clientId,
                          runId: data.runId,
                        }
                      ),
                      { qos: 1 },
                      (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
                    );
                  }
                  activePipelines[data.runId].remote.resolve(data.output);
                })
                .catch((e) => {
                  if (data.output.success) throw e;
                  mqtCon.publish(
                    'run',
                    JSON.stringify(
                      {
                        id: clientId,
                        runId: data.runId,
                        error: { stack: e.stack, message: e.message },
                      }
                    ),
                    { qos: 1 },
                    (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
                  );
                  activePipelines[data.runId].remote.reject(e);
                });
            } else if (data.error && activePipelines[data.runId]) {
              activePipelines[data.runId].state = 'received error';
              activePipelines[data.runId].remote.reject(Object.assign(new Error(), data.error));
            }
            break;
          case `${clientId}-register`:
            if (activePipelines[data.runId]) {
              if (activePipelines[data.runId].registered) break;
              activePipelines[data.runId].registered = true;
              if (activePipelines[data.runId].stashedOutput) {
                activePipelines[data.runId]
                  .communicate(
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
    }


    return {
      activePipelines,
      clientId,
      io,
      mode,
      operatingDirectory,
      remoteClients,
      socket,
      mqtCon,

      /**
       * Starts a pipeline given a pipeline spec, client list and unique ID
       * for that pipeline. The return object is that pipeline and a promise that
       * resolves to the final output of the pipeline.
       * @param  {Object} spec         a valid pipeline specification
       * @param  {Array}  [clients=[]] a list of client IDs particapating in pipeline
       *                               only necessary for decentralized runs
       * @param  {String} runId        unique ID for the pipeline
       * @return {Object}              an object containing the active pipeline and
       *                               Promise for its result
       */
      startPipeline({ spec, clients = [], runId }) {
        if (activePipelines[runId] && activePipelines[runId].state !== 'pre-pipeline') {
          throw new Error('Duplicate pipeline started');
        }

        const userDirectories = {
          baseDirectory: path.resolve(operatingDirectory, 'input', clientId, runId),
          outputDirectory: path.resolve(operatingDirectory, 'output', clientId, runId),
          cacheDirectory: path.resolve(operatingDirectory, 'cache', clientId, runId),
          transferDirectory: path.resolve(operatingDirectory, 'transfer', clientId, runId),
        };
        activePipelines[runId] = Object.assign(
          {
            state: 'created',
            pipeline: Pipeline.create(spec, runId, {
              mode,
              operatingDirectory,
              clientId,
              userDirectories,
              owner: spec.owner,
              logger,
              dockerManager,
            }),
            baseDirectory: path.resolve(operatingDirectory, 'input', clientId, runId),
            cacheDirectory: userDirectories.cacheDirectory,
            outputDirectory: userDirectories.outputDirectory,
            transferDirectory: userDirectories.transferDirectory,
            systemDirectory: path.resolve(operatingDirectory, 'system', clientId, runId),
            stateEmitter: new Emitter(),
            currentState: {},
            stashedOuput: undefined,
            communicate: undefined,
            clients,
            remote: { reject: () => {} }, // noop for pre pipe errors
            owner: spec.owner,
            limitOutputToOwner: spec.limitOutputToOwner,
          },
          activePipelines[runId]
        );

        // remote client object creation
        clients.forEach((client) => {
          remoteClients[client] = Object.assign(
            {
              id: client,
              state: 'unregistered',
              [runId]: { state: {}, files: { expected: [], received: [] } },
            },
            remoteClients[client]
          );
        });

        if (mode === 'local') {
          activePipelines[runId].registered = false;
          mqtCon.publish(
            'register',
            JSON.stringify({ id: clientId, runId }),
            { qos: 1 }
          );
        }
        /**
         * Communicate with the with node(s), clients to remote or remote to clients
         * @param  {Object} pipeline pipeline to preform the messaging on
         * @param  {Object} message  data to serialize to recipient
         */
        activePipelines[runId].communicate = async (pipeline, message, messageIteration) => {
          if (mode === 'remote') {
            if (message instanceof Error) {
              const runError = Object.assign(
                message,
                {
                  error: `Pipeline error from central node\n Error details: ${message.error}`,
                  message: `Pipeline error from central node\n Error details: ${message.message}`,
                  stack: message.stack,
                }
              );
              activePipelines[pipeline.id].state = 'central node error';
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
                  if (data && (data.files.length !== 0 || data.directories.length !== 0)) {
                    const archive = archiver('tar', {
                      gzip: true,
                      gzipOptions: {
                        level: 2,
                      },
                    });
                    const archiveName = `${pipeline.id}-${uuid()}-tempOutput.tar.gz`;
                    const archiveFp = path.join(
                      activePipelines[pipeline.id].transferDirectory, archiveName
                    );
                    const output = fs.createWriteStream(
                      archiveFp
                    );

                    const archProm = new Promise((resolve, reject) => {
                      output.on('close', () => {
                        resolve();
                      });

                      archive.on('error', (err) => {
                        reject(err);
                      });
                    });

                    archive.pipe(output);
                    data.files.forEach((file) => {
                      archive.append(
                        fs.createReadStream(
                          path.join(activePipelines[pipeline.id].transferDirectory, file)
                        ),
                        { name: file }
                      );
                    });
                    data.directories.forEach((dir) => {
                      archive.directory(
                        path.join(activePipelines[pipeline.id].transferDirectory, dir),
                        dir
                      );
                    });
                    archive.finalize();
                    return archProm.then(() => {
                      if (message.success) {
                        activePipelines[pipeline.id].finalTransferList = new Set();
                      }
                      clientPublish(
                        activePipelines[pipeline.id].clients,
                        {
                          runId: pipeline.id,
                          output: message,
                          files: [archiveName],
                          iteration: messageIteration,
                        },
                        {
                          success: message.success,
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
                      iteration: messageIteration,
                    },
                    {
                      success: message.success,
                      limitOutputToOwner: activePipelines[pipeline.id].limitOutputToOwner,
                      owner: activePipelines[pipeline.id].owner,
                    }

                  );
                });
            }
          // local client
          } else {
            if (message instanceof Error) { // eslint-disable-line no-lonely-if
              if (!activePipelines[pipeline.id].registered) {
                activePipelines[pipeline.id].stashedOutput = message;
              } else {
                mqtCon.publish(
                  'run',
                  JSON.stringify({ id: clientId, runId: pipeline.id, error: message }),
                  { qos: 1 },
                  (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
                );
                activePipelines[pipeline.id].stashedOutput = undefined;
              }
            } else {
              await getFilesAndDirs(activePipelines[pipeline.id].transferDirectory)
                .then((data) => {
                  if (data && (data.files.length !== 0 || data.directories.length !== 0)) {
                    if (!activePipelines[pipeline.id].registered) {
                      activePipelines[pipeline.id].stashedOutput = message;
                    } else {
                      const archiveFilename = `${pipeline.id}-${clientId}-tempOutput.tar.gz`;
                      const output = fs.createWriteStream(
                        path.join(activePipelines[pipeline.id].transferDirectory, archiveFilename)
                      );
                      const archive = archiver('tar', {
                        gzip: true,
                        gzipOptions: {
                          level: 2,
                        },
                      });

                      const archProm = new Promise((resolve, reject) => {
                        output.on('close', () => {
                          resolve();
                        });

                        archive.on('error', (err) => {
                          reject(err);
                        });
                      });

                      archive.pipe(output);
                      data.files.forEach((file) => {
                        archive.append(
                          fs.createReadStream(
                            path.join(activePipelines[pipeline.id].transferDirectory, file)
                          ),
                          { name: file }
                        );
                      });
                      data.directories.forEach((dir) => {
                        archive.directory(
                          path.join(activePipelines[pipeline.id].transferDirectory, dir),
                          dir
                        );
                      });
                      archive.finalize();
                      return archProm.then(() => {
                        logger.debug('############# Local client sending out data with files');
                        mqtCon.publish(
                          'run',
                          JSON.stringify({
                            id: clientId,
                            runId: pipeline.id,
                            output: message,
                            files: [archiveFilename],
                            iteration: messageIteration,
                          }),
                          { qos: 1 },
                          (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
                        );
                        activePipelines[pipeline.id].stashedOutput = undefined;
                        transferFiles(
                          'post',
                          100,
                          [archiveFilename],
                          clientId,
                          pipeline.id,
                          activePipelines[pipeline.id].transferDirectory
                        ).catch((e) => {
                          // files failed to send, bail
                          logger.error(`Client file send error: ${e}`);
                          mqtCon.publish(
                            'run',
                            JSON.stringify(
                              {
                                id: clientId,
                                runId: pipeline.id,
                                error: { stack: e.stack, message: e.message },
                              }
                            ),
                            { qos: 1 },
                            (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
                          );
                        });
                      });
                    }
                  } else {
                    if (!activePipelines[pipeline.id].registered) { // eslint-disable-line no-lonely-if, max-len
                      activePipelines[pipeline.id].stashedOutput = message;
                    } else {
                      logger.debug('############# Local client sending out data');
                      mqtCon.publish(
                        'run',
                        JSON.stringify({
                          id: clientId,
                          runId: pipeline.id,
                          output: message,
                          iteration: messageIteration,
                        }),
                        { qos: 1 },
                        (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
                      );
                      activePipelines[pipeline.id].stashedOutput = undefined;
                    }
                  }
                });
            }
          }
        };

        /**
         * callback fn passed down to facilitate external communication
         * @param  {[type]} input        data to send
         * @param  {[type]} noop         do nothing but resolve
         * @param  {[type]} transmitOnly send without input
         * @param  {[type]} iteration    the iteration for the input
         * @return {[type]}              Promise when we get a response
         */
        const remoteHandler = async ({
          input, noop, transmitOnly, iteration,
        }) => {
          let proxRes;
          let proxRej;

          const prom = new Promise((resolve, reject) => {
            proxRes = resolve;
            proxRej = reject;
          });
          activePipelines[runId].remote = {
            resolve: proxRes,
            reject: proxRej,
          };
          if (!noop) {
            await activePipelines[runId].communicate(
              activePipelines[runId].pipeline,
              input,
              iteration
            );
            // only send out results, don't wait
            // this allows the last remote iteration to just finish
            if (transmitOnly) {
              proxRes();
            }

            if (mode === 'remote') activePipelines[runId].state = 'running';
          } else if (activePipelines[runId].state === 'created') {
            activePipelines[runId].state = 'running';
            activePipelines[runId].clients.forEach((client) => {
              serverMqt.publish(`${client}-register`, JSON.stringify({ runId }));
            });
          }
          return prom;
        };

        const pipelineProm = Promise.all([
          mkdirp(this.activePipelines[runId].baseDirectory),
          mkdirp(this.activePipelines[runId].outputDirectory),
          mkdirp(this.activePipelines[runId].cacheDirectory),
          mkdirp(this.activePipelines[runId].transferDirectory),
          mkdirp(this.activePipelines[runId].systemDirectory),
        ])
          .catch((err) => {
            throw new Error(`Unable to create pipeline directories: ${err}`);
          })
          .then(() => {
            this.activePipelines[runId].pipeline.stateEmitter.on('update',
              data => this.activePipelines[runId].stateEmitter
                .emit('update', Object.assign({}, data, activePipelines[runId].currentState)));

            return activePipelines[runId].pipeline.run(remoteHandler)
              .then((res) => {
                activePipelines[runId].state = 'finished';
                return res;
              });
          }).then((res) => {
            if (!activePipelines[runId].finalTransferList
                || activePipelines[runId].clients
                  .every(value => activePipelines[runId].finalTransferList.has(value))
                || (
                  activePipelines[runId].limitOutputToOwner
                  && activePipelines[runId].finalTransferList.has(activePipelines[runId].owner)
                )
                // allow locals to cleanup in sim
                || mode === 'local'
            ) {
              return cleanupPipeline(runId)
                .then(() => { return res; });
            }
            // we have clients waiting on final transfer output, just give results
            return res;
          });

        return {
          pipeline: activePipelines[runId].pipeline,
          result: pipelineProm,
          stateEmitter: activePipelines[runId].stateEmitter,
        };
      },
      getPipelineStateListener(runId) {
        if (!this.activePipelines[runId]) {
          throw new Error('invalid pipeline ID');
        }

        return this.activePipelines[runId].stateEmitter;
      },
      stopPipeline(pipelineId, runId) {
        const run = this.activePipelines[runId];

        if (!run) {
          throw new Error('Invalid pipeline ID');
        }

        const currentStepNumber = run.pipeline.currentStep;
        const currentStep = run.pipeline.pipelineSteps[currentStepNumber];

        if (currentStep) {
          currentStep.stop();
        }
      },
      waitingOnForRun,
      dockerManager,
    };
  },
};
