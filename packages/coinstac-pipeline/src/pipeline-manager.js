'use strict';

const http = require('http');
const fs = require('fs');
const _ = require('lodash');
const socketIO = require('socket.io');
const socketIOClient = require('socket.io-client');
const mqtt = require('mqtt');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const rimraf = promisify(require('rimraf'));
const path = require('path');
const ss = require('socket.io-stream');

const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);
const Emitter = require('events');
const winston = require('winston');
const { createReadStream, createWriteStream } = require('fs');

winston.loggers.add('pipeline', {
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
const defaultLogger = winston.loggers.get('pipeline');
defaultLogger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';

const Pipeline = require('./pipeline');

// helpers

/**
 * Send a file via a socket stream
 * @param  {Object} socket [description]
 * @param  {string} file   [description]
 * @param  {Object} data   [description]
 */
const sendFile = (socket, filePath, data) => {
  const fsStream = createReadStream(filePath);

  const stream = ss.createStream();
  ss(socket).emit('file', stream, data);
  fsStream.pipe(stream);
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
  create({
    authPlugin,
    authOpts,
    clientId,
    logger,
    operatingDirectory = './',
    mode,
    remotePathname = '',
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
    logger = logger || defaultLogger;

    const clientPublish = (clientList, data) => {
      clientList.forEach((client) => {
        serverMqt.publish(`${client}-run`, JSON.stringify(data), { qos: 1 }, err => logger.error(err));
      });
    };

    const waitingOnForRun = (runId) => {
      // logger.silly('Remote client state:');
      const waiters = [];
      activePipelines[runId].clients.forEach((client) => {
        // logger.silly(`${client}`);
        // logger.silly(`Output: ${!!remoteClients[client][runId].currentOutput}`);
        // logger.silly(`Files: ${JSON.stringify(remoteClients[client][runId].files)}`);
        const clientRun = remoteClients[client][runId];
        if ((clientRun
          && !clientRun.currentOutput)
        // test if we have all files, if there are any
          || (clientRun
            && ((clientRun.files
              && ((clientRun.files.expected.length === 0
                || clientRun.files.received.length === 0)
              || !clientRun.files.expected
                .every(e => clientRun.files.received.includes(e))
              ))
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
          client[runId].files = undefined;
        }
        return memo;
      }, {});
    };

    // TODO: secure socket layer
    if (mode === 'remote') {
      const app = http.createServer();
      // these options are passed down to engineIO, both allow larger transport sizes
      io = socketIO(app, {
        pingTimeout: 180000,
        maxHttpBufferSize: 3E8,
      });

      app.listen(remotePort);
      serverMqt = mqtt.connect(`${mqttRemoteProtocol}//${mqttRemoteURL}:${mqttRemotePort}`, { clientId });

      serverMqt.on('connect', () => {
        logger.silly('mqtt connection up');
        serverMqt.subscribe('register', { qos: 1 }, (err) => {
          if (err) logger.error(err);
        });
        serverMqt.subscribe('run', { qos: 1 }, (err) => {
          if (err) logger.error(err);
        });
      });

      serverMqt.on('message', (topic, dataBuffer) => {
        const data = JSON.parse(dataBuffer);
        switch (topic) {
          case 'run':
            logger.silly(`############ Received client data: ${data.id}`);
            // client run started before remote
            if (!activePipelines[data.runId]) {
              activePipelines[data.runId] = {
                state: 'pre-pipeline',
                currentState: {},
              };
            }
            if (!remoteClients[data.id]) {
              return serverMqt.publish(`${data.id}-run`, { runId: data.runId, error: new Error('Remote has no such pipeline run') });
            }
            if (activePipelines[data.runId].state === 'pre-pipeline' && remoteClients[data.id][data.runId] === undefined) {
              remoteClients[data.id] = Object.assign(
                {
                  [data.runId]: { state: {} },
                },
                remoteClients[data.id]
              );
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
                    remoteClients[data.id][data.runId].files = remoteClients[data.id][data.runId].files ? // eslint-disable-line max-len, operator-linebreak
                      Object.assign(
                        {},
                        remoteClients[data.id][data.runId].files,
                        { expected: data.files }
                      )
                      : { expected: data.files, received: [], processing: [] };
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
                  io.of('/').to(data.runId).emit('run', { runId: data.runId, error: activePipelines[data.runId].error });
                }
              } else {
                const runError = Object.assign(
                  new Error(),
                  data.error,
                  {
                    error: `Pipeline error from user: ${data.id}\n Error details: ${data.error.error}`,
                    message: `Pipeline error from user: ${data.id}\n Error details: ${data.error.message}`,
                  }
                );
                activePipelines[data.runId].state = 'received client error';
                activePipelines[data.runId].error = runError;
                io.of('/').to(data.runId).emit('run', { runId: data.runId, error: runError });
                activePipelines[data.runId].remote.reject(runError);
              }
            }
            break;
          default:
        }
      });

      const socketServer = (socket) => {
        // TODO: not the way to do this, as runs would have to
        // always start before clients connected....
        // need proper auth
        // if (!remoteClients[socket.handshake.query.id]) {
        //   // bye 👋
        //   socket.disconnect();
        // }
        socket.emit('hello', { status: 'connected' });

        socket.on('register', (data) => {
          logger.silly(`############ Registered client ${data.id}`);
          if (!remoteClients[data.id]) {
            remoteClients[data.id] = {};
          }
          remoteClients[data.id].status = 'connected';
          remoteClients[data.id].socketId = socket.id;
          remoteClients[data.id].id = data.id;
          remoteClients[data.id].socket = socket;
          remoteClients[data.id].lastSeen = Math.floor(Date.now() / 1000);
          if (data.runs) {
            data.runs.forEach((run) => {
              if (remoteClients[data.id][run]) {
                // reset state queries on reconn
                remoteClients[data.id][run].stateQueried = false;
              }
            });
          }
        });

        /**
         * File transfer socket listener
         */
        ss(socket).on('file', (stream, data) => {
          if (activePipelines[data.runId] && !activePipelines[data.runId].error) {
            const currentClient = remoteClients[data.id][data.runId];
            if (currentClient.files
              && currentClient.files.processing) {
              currentClient.files.processing.push(data.file);
            } else {
              currentClient.files = Object.assign({
                processing: [data.file],
              }, currentClient.files || { expected: [], received: [] });
            }

            mkdirp(path.join(activePipelines[data.runId].baseDirectory, data.id))
              .then(() => {
                const wStream = createWriteStream(
                  path.join(activePipelines[data.runId].baseDirectory, data.id, data.file)
                );
                stream.pipe(wStream);
                wStream.on('close', () => {
                  // mark off and check to start run
                  currentClient.files.received.push(data.file);

                  if (waitingOnForRun(data.runId).length === 0) {
                    activePipelines[data.runId].state = 'received all client data';
                    logger.silly('Received all client file data');
                    // clear transfer and start run
                    activePipelines[data.runId].remote.resolve(
                      rimraf(path.join(activePipelines[data.runId].transferDirectory, '*')).then(() => ({ output: aggregateRun(data.runId) }))
                    );
                  }
                  // socket.disconnect();
                });
                wStream.on('error', (error) => {
                  // reject pipe
                  activePipelines[data.runId].remote.reject(error);
                  // socket.disconnect();
                });
              });
          }
        });

        socket.on('disconnect', (reason) => {
          logger.error(`Client disconnect error: ${reason}`);
          const client = _.find(remoteClients, { socketId: socket.id });
          if (client) {
            logger.error(`From client: ${client.id}`);
            Object.keys(activePipelines).forEach((pipeline) => {
              if (client[pipeline] && client[pipeline].files) {
                client[pipeline].files.processing = [];
              }
            });
            client.status = 'disconnected';
            client.error = reason;
          }
        });
      };

      if (authPlugin) {
        io.on('connection', authPlugin.authorize(authOpts))
          .on('authenticated', socketServer);
      } else {
        io.on('connection', socketServer);
      }
    } else {
      /** ***********************
       * Client side socket code
       ** ***********************
       */
      socket = socketIOClient(
        `${remoteProtocol}//${remoteURL}:${remotePort}${remotePathname}?id=${clientId}`
      );
      socket.on('hello', () => {
        logger.silly('Client register request');
        socket.emit('register', { id: clientId, runs: Object.keys(activePipelines) });
      });

      mqtCon = mqtt.connect(`${mqttRemoteProtocol}//${mqttRemoteURL}:${mqttRemotePort}`, { clientId });

      mqtCon.on('connect', () => {
        logger.silly('mqtt connection up');
        mqtCon.subscribe(`${clientId}-register`, { qos: 1 }, (err) => {
          logger.silly('Client register request');
          if (err) logger.error(err);
          mqtCon.publish(
            'register',
            JSON.stringify({ id: clientId, runs: Object.keys(activePipelines) }),
            { qos: 1 }
          );
        });
        mqtCon.subscribe(`${clientId}-run`, { qos: 1 }, (err) => {
          if (err) logger.error(err);
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
              if (data.files) {
                // we've already received the files
                if (activePipelines[data.runId].files
                 && data.files.every(e => activePipelines[data.runId].files.received.includes(e))
                ) {
                  activePipelines[data.runId].remote.resolve(data.output);
                  activePipelines[data.runId].currentInput = undefined;
                  activePipelines[data.runId].files = undefined;
                } else {
                  activePipelines[data.runId].files = Object.assign(
                    {}, { expected: data.files }, activePipelines[data.runId].files
                  );
                  activePipelines[data.runId].currentInput = data.output;
                }
              } else {
                // clear transfer dir after we know its been transfered
                activePipelines[data.runId].remote.resolve(
                  rimraf(path.join(activePipelines[data.runId].transferDirectory, '*')).then(() => data.output)
                );
              }
            } else if (data.error && activePipelines[data.runId]) {
              activePipelines[data.runId].state = 'received error';
              activePipelines[data.runId].remote.reject(Object.assign(new Error(), data.error));
            }
            break;
          default:
        }
      });
      /**
       * File transfer socket listener
       */
      ss(socket).on('file', (stream, data) => {
        if (activePipelines[data.runId]) {
          const wStream = createWriteStream(
            path.join(activePipelines[data.runId].baseDirectory, data.file)
          );
          stream.pipe(wStream);
          wStream.on('close', () => {
            // mark off and start run?
            if (activePipelines[data.runId].files && activePipelines[data.runId].files.received) {
              activePipelines[data.runId].files.received.push(data.file);
            } else if (activePipelines[data.runId].files) {
              activePipelines[data.runId].files.received = [data.file];
            } else {
              activePipelines[data.runId].files = { received: [data.file] };
            }

            if (activePipelines[data.runId].files
              && activePipelines[data.runId].files.expected
              && activePipelines[data.runId].files.received
              && activePipelines[data.runId].currentInput
              && (activePipelines[data.runId].files.expected
                .every(e => activePipelines[data.runId].files.received.includes(e)))) {
              activePipelines[data.runId].remote.resolve(activePipelines[data.runId].currentInput);
              activePipelines[data.runId].currentInput = undefined;
              activePipelines[data.runId].files = undefined;
            }
            // socket.disconnect();
          });
          wStream.on('error', (error) => {
            // reject pipe
            activePipelines[data.runId].remote.reject(error);
            // socket.disconnect();
          });
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
          baseDirectory: path.resolve(operatingDirectory, clientId, runId),
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
            }),
            baseDirectory: userDirectories.baseDirectory,
            cacheDirectory: userDirectories.cacheDirectory,
            outputDirectory: userDirectories.outputDirectory,
            transferDirectory: userDirectories.transferDirectory,
            systemDirectory: path.resolve(operatingDirectory, 'system', clientId, runId),
            stateEmitter: new Emitter(),
            currentState: {},
            clients,
          },
          activePipelines[runId]
        );

        // remote client object creation
        clients.forEach((client) => {
          remoteClients[client] = Object.assign(
            {
              id: client,
              status: 'unregistered',
              [runId]: { state: {}, stateQueried: false },
            },
            remoteClients[client]
          );
        });

        /**
         * Communicate with the with node(s), clients to remote or remote to clients
         * @param  {Object} pipeline pipeline to preform the messaging on
         * @param  {Object} message  data to serialize to recipient
         */
        const communicate = (pipeline, message, messageIteration) => {
          if (mode === 'remote') {
            if (message instanceof Error) {
              const runError = Object.assign(
                message,
                {
                  error: `Pipeline error from central node\n Error details: ${message.error}`,
                  message: `Pipeline error from central node\n Error details: ${message.message}`,
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
              readdir(activePipelines[pipeline.id].transferDirectory)
                .then((files) => {
                  if (files && files.length !== 0) {
                    clientPublish(
                      activePipelines[pipeline.id].clients,
                      {
                        runId: pipeline.id, output: message, files, iteration: messageIteration,
                      }
                    );
                    activePipelines[pipeline.id].clients.forEach((key) => {
                      if (remoteClients[key]) {
                        files.forEach((file) => {
                          sendFile(
                            remoteClients[key].socket,
                            path.join(activePipelines[pipeline.id].transferDirectory, file),
                            {
                              id: clientId,
                              file,
                              runId: pipeline.id,
                            }
                          );
                        });
                      }
                    });
                  } else {
                    clientPublish(
                      activePipelines[pipeline.id].clients,
                      { runId: pipeline.id, output: message, iteration: messageIteration }
                    );
                  }
                });
            }
          // local client
          } else {
            if (message instanceof Error) { // eslint-disable-line no-lonely-if
              mqtCon.publish(
                'run',
                JSON.stringify({ id: clientId, runId: pipeline.id, error: message }),
                { qos: 1 },
                err => logger.error(err)
              );
            } else {
              return readdir(activePipelines[pipeline.id].transferDirectory)
                .then((files) => {
                  return rimraf(path.join(activePipelines[pipeline.id].systemDirectory, `${pipeline.id}`))
                    .then(() => writeFile(
                      path.join(activePipelines[pipeline.id].systemDirectory, `${pipeline.id}`),
                      JSON.stringify({ savedOutput: message, savedFileList: files })
                    )).then(() => files);
                }).then((files) => {
                  if (files && files.length !== 0) {
                    logger.debug('############# Local client sending out data with files');
                    mqtCon.publish(
                      'run',
                      JSON.stringify({
                        id: clientId,
                        runId: pipeline.id,
                        output: message,
                        files,
                        iteration: messageIteration,
                      }),
                      { qos: 1 },
                      err => logger.error(err)
                    );
                    files.forEach((file) => {
                      sendFile(
                        socket,
                        path.join(activePipelines[pipeline.id].transferDirectory, file),
                        {
                          id: clientId,
                          file,
                          runId: pipeline.id,
                        }
                      );
                    });
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
                      err => logger.error(err)
                    );
                  }
                });
            }
          }
        };

        const remoteHandler = ({
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
            // only send out results, don't wait
            // this allows the last remote iteration to just finish
            if (transmitOnly) {
              proxRes();
            }
            communicate(activePipelines[runId].pipeline, input, iteration);
            activePipelines[runId].state = 'running';
          } else if (activePipelines[runId].state === 'pre-pipeline') {
            const waitingOn = waitingOnForRun(runId);
            activePipelines[runId].currentState.waitingOn = waitingOn;
            activePipelines[runId].stateEmitter
              .emit('update',
                Object.assign(
                  {},
                  activePipelines[runId].pipeline.currentState,
                  activePipelines[runId].currentState
                ));

            if (waitingOn.length === 0) {
              proxRes({ output: aggregateRun(runId) });
            }
            activePipelines[runId].state = 'running';
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
            return Promise.all([
              rimraf(path.resolve(this.activePipelines[runId].transferDirectory, '*')),
              rimraf(path.resolve(this.activePipelines[runId].cacheDirectory, '*')),
              rimraf(path.resolve(this.activePipelines[runId].systemDirectory, '*')),
            ]).then(() => res);
          })
          .then((res) => {
            delete activePipelines[runId];
            Object.keys(remoteClients).forEach((key) => {
              if (remoteClients[key][runId]) {
                delete remoteClients[key][runId];
              }
            });
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
    };
  },
};
