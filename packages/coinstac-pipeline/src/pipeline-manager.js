'use strict';

const http = require('http');
const fs = require('fs');
const socketIO = require('socket.io');
const socketIOClient = require('socket.io-client');
const _ = require('lodash');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const rimraf = promisify(require('rimraf'));
const path = require('path');

const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const Emitter = require('events');
const winston = require('winston');
const ss = require('socket.io-stream');
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
    remoteURL = 'localhost',
    unauthHandler, // eslint-disable-line no-unused-vars
  }) {
    const activePipelines = {};
    let io;
    let socket;
    const remoteClients = {};
    logger = logger || defaultLogger;
    // TODO: const missedCache = {};

    const waitingOnForRun = (runId) => {
      logger.silly('Remote client state:');
      const waiters = [];
      activePipelines[runId].clients.forEach((client) => {
      logger.silly(`${client}`);
      logger.silly(`Output: ${!!remoteClients[client][runId].currentOutput}`);
      logger.silly(`Files: ${JSON.stringify(remoteClients[client][runId].files)}`);
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
      io = socketIO(app, { pingTimeout: 360000, maxHttpBufferSize: 1E9 });

      app.listen(remotePort);

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
          remoteClients[data.id].socket = socket;
          remoteClients[data.id].lastSeen = Math.floor(Date.now() / 1000);
        });

        socket.on('run', (data) => {
          logger.silly(`############ Received client data: ${data.id}`);
          // client run started before remote
          if (!activePipelines[data.runId]) {
            activePipelines[data.runId] = {
              state: 'pre-pipeline',
              currentState: {},
            };
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
            socket.join(data.runId);
            remoteClients[data.id].lastSeen = Math.floor(Date.now() / 1000);

            // is the client giving us an error?
            if (!data.error) {
              // has this pipeline error'd out?
              if (!activePipelines[data.runId].error) {
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
          const client = _.find(remoteClients, { socketId: socket.id });
          if (client) {
            client.status = 'disconnected';
            client.error = reason;
          }
        });
        /**
         * Long poll backup for run data
         */
        setInterval(() => {
          Object.keys(activePipelines).forEach((runId) => {
            waitingOnForRun(runId).forEach((clientId) => {
              const clientRun = remoteClients[clientId][runId];
              // we have everything some files are just processing
              if (activePipelines[runId].pipeline.currentState.controllerState === 'waiting on local users'
                && clientRun.files && clientRun.currentOutput && clientRun.files.expected
                .every(e => [
                  ...clientRun.files.received,
                  ...clientRun.files.processing,
                ].includes(e))) {
                return;
              }
              logger.silly(`Asking client state: ${clientId}`);
              remoteClients[clientId].socket.emit('state', { runId });
            });
          });
        }, 30000);
        /**
         * Pipeline state socket listener
         */
        socket.on('state', (data) => {
          const client = remoteClients[data.id][data.runId];
          if (data.state.controllerState === 'waiting on central node'
          && activePipelines[data.runId].pipeline.currentState.controllerState === 'waiting on local users'
          && activePipelines[data.runId].pipeline.currentState.currentIteration
          === data.state.currentIteration - 1
          && (client && client.state.retransmitting
            ? (Date.now() - client.state.retransmitTime > 60000) : true)) {
            let files = [];
            if (client.files) {
              files = client.files.expected.reduce((memo, file) => {
                if (![...client.files.processing, ...client.files.received].includes(file)) {
                  memo.push(file);
                }
                return memo;
              }, []);
            }
            const output = !client.currentOutput;
            logger.silly(`Asking client to retransmit: ${JSON.stringify({ runId: data.runId, files, output })}`);
            remoteClients[data.id].socket.emit('retransmit', { runId: data.runId, files, output });
            client.state = Object.assign(
              {},
              client.state,
              { retransmitting: true, retransmitTime: Date.now() }
            );
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
      socket = socketIOClient(`${remoteProtocol}//${remoteURL}:${remotePort}${remotePathname}?id=${clientId}`);
      socket.on('hello', () => {
        socket.emit('register', { id: clientId });
      });
      /**
       * Pipeline socket listener
       */
      socket.on('run', (data) => {
        // TODO: step check?
        if (!data.error && activePipelines[data.runId]) {
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
      /**
       * Pipeline state socket listener
       */
      socket.on('state', (data) => {
        socket.emit('state', {
          state: Object.assign(
            {},
            activePipelines[data.runId].pipeline.currentState,
            activePipelines[data.runId].currentState
          ),
          id: clientId,
          runId: data.runId,
        });
      });
      /**
       * Retransmit socket listener
       */
      socket.on('retransmit', (data) => {
        data.files.forEach((file) => {
          sendFile(
            socket,
            path.join(activePipelines[data.runId].transferDirectory, file),
            { runId: data.runId, file, id: clientId }
          );
        });
        if (data.output) {
          readFile(path.join(activePipelines[data.runId].systemDirectory, `${data.runId}`), 'utf8')
            .then((output) => {
              output = JSON.parse(output);
              socket.emit('run', {
                id: clientId,
                runId: data.runId,
                output: output.savedOutput,
                files: output.savedFileList && output.savedFileList.length > 0
                  ? output.savedFileList : undefined,
                boop: undefined,
              });
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
        clients.forEach((client) => {
          remoteClients[client] = Object.assign(
            {
              status: 'unregistered',
              [runId]: { state: {} },
            },
            remoteClients[client]
          );
        });

        /**
         * Communicate with the with node(s), clients to remote or remote to clients
         * @param  {Object} pipeline pipeline to preform the messaging on
         * @param  {Object} message  data to serialize to recipient
         */
        const communicate = (pipeline, message) => {
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
              io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, error: runError });
            } else {
              logger.silly('############ Sending out remote data');
              io.of('/').in(pipeline.id).clients((error, clients) => {
                if (error) throw error;
                readdir(activePipelines[pipeline.id].transferDirectory)
                  .then((files) => {
                    if (files && files.length !== 0) {
                      io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, output: message, files });
                      Object.keys(remoteClients).forEach((key) => {
                        if (clients.includes(remoteClients[key].socketId)) {
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
                      io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, output: message });
                    }
                  });
              });
            }
          // local client
          } else {
            if (message instanceof Error) { // eslint-disable-line no-lonely-if
              socket.emit('run', { id: clientId, runId: pipeline.id, error: message });
            } else {
              logger.debug('############# Local client sending out data');
              return readdir(activePipelines[pipeline.id].transferDirectory)
                .then((files) => {
                  return rimraf(path.join(activePipelines[pipeline.id].systemDirectory, `${pipeline.id}`))
                    .then(() => writeFile(
                      path.join(activePipelines[pipeline.id].systemDirectory, `${pipeline.id}`),
                      JSON.stringify({ savedOutput: message, savedFileList: files })
                    )).then(() => files);
                }).then((files) => {
                  if (files && files.length !== 0) {
                    socket.emit('run', {
                      id: clientId, runId: pipeline.id, output: message, files,
                    });
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
                    socket.emit('run', { id: clientId, runId: pipeline.id, output: message });
                  }
                });
            }
          }
        };

        const remoteHandler = ({ input, noop, transmitOnly }) => {
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
            communicate(activePipelines[runId].pipeline, input);
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
