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
const readdir = promisify(require('fs').readdir);
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
const logger = winston.loggers.get('pipeline');
logger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';

const Pipeline = require('./pipeline');

module.exports = {

  /**
   * A pipeline manager factory, returns a manager in either a remote or local operating
   * mode that then can run and manipulate pipelines.
   * @param  {String} mode                     either local or remote
   * @param  {String} clientId                 the unique ID that identifies this manager
   * @param  {String} [operatingDirectory='./' }] the operating directory
   *                                              for results and other file IO
   * @return {Object}                          A pipeline manager
   */
  create({
    authPlugin,
    authOpts,
    clientId,
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
    // TODO: const missedCache = {};

    const waitingOnForRun = (runId) => {
      const waiters = [];
      activePipelines[runId].clients.forEach((client) => {
        if ((remoteClients[client][runId]
          && !remoteClients[client][runId].currentOutput)
        // test if we have all files, if there are any
          || (remoteClients[client][runId]
            && ((remoteClients[client][runId].files
              && ((remoteClients[client][runId].files.expected.length === 0
                || remoteClients[client][runId].files.recieved.length === 0)
              || !remoteClients[client][runId].files.expected
                .every(e => remoteClients[client][runId].files.recieved.includes(e))))
          || (!remoteClients[client][runId].files)))) {
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
      io = socketIO(app, { pingTimeout: 360000, maxHttpBufferSize: 23E7 });

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
          if (!remoteClients[data.id]) {
            remoteClients[data.id] = {};
          }
          remoteClients[data.id].status = 'connected';
          remoteClients[data.id].socketId = socket.id;
          remoteClients[data.id].socket = socket;
          remoteClients[data.id].lastSeen = Math.floor(Date.now() / 1000);
        });

        socket.on('run', (data) => {
          logger.silly(`############ CLIENT ${data.id}`);
          logger.silly(JSON.stringify(data, null, 2));
          logger.silly(`############ END CLIENT ${data.id}`);
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
                [data.runId]: {},
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
                    : { expected: data.files, recieved: [] };
                }
                if (activePipelines[data.runId].state !== 'pre-pipeline') {
                  const waitingOn = waitingOnForRun(data.runId);
                  activePipelines[data.runId].currentState.waitingOn = waitingOn;
                  activePipelines[data.runId].stateEmitter
                    .emit('update',
                      Object.assign(
                        {},
                        activePipelines[data.runId].pipeline.currentState,
                        activePipelines[data.runId].currentState
                      ));

                  if (waitingOn.length === 0) {
                    activePipelines[data.runId].state = 'recieved all clients data';
                    logger.silly('Received all client data');
                    activePipelines[data.runId].remote.resolve({
                      output: aggregateRun(data.runId),
                    });
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
              activePipelines[data.runId].state = 'recieved client error';
              activePipelines[data.runId].error = runError;
              io.of('/').to(data.runId).emit('run', { runId: data.runId, error: runError });
              activePipelines[data.runId].remote.reject(runError);
            }
          }
        });
        ss(socket).on('file', (stream, data) => {
          if (activePipelines[data.runId] && !activePipelines[data.runId].error) {
            mkdirp(path.join(activePipelines[data.runId].baseDirectory, data.id))
              .then(() => {
                const wStream = createWriteStream(
                  path.join(activePipelines[data.runId].baseDirectory, data.id, data.file)
                );
                stream.pipe(wStream);
                wStream.on('close', () => {
                  // mark off and check to start run
                  if (remoteClients[data.id][data.runId].files
                    && remoteClients[data.id][data.runId].files.recieved) {
                    remoteClients[data.id][data.runId].files.recieved.push(data.file);
                  } else {
                    // first entry, set both objects up
                    remoteClients[data.id][data.runId].files = {
                      expected: [], recieved: [data.file],
                    };
                  }

                  if (waitingOnForRun(data.runId).length === 0) {
                    activePipelines[data.runId].state = 'recieved all client data';
                    logger.silly('Received all client data');
                    activePipelines[data.runId].remote.resolve(
                      { output: aggregateRun(data.runId) }
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
      };

      if (authPlugin) {
        io.on('connection', authPlugin.authorize(authOpts))
          .on('authenticated', socketServer);
      } else {
        io.on('connection', socketServer);
      }
    } else {
      socket = socketIOClient(`${remoteProtocol}//${remoteURL}:${remotePort}${remotePathname}?id=${clientId}`);
      socket.on('hello', () => {
        socket.emit('register', { id: clientId });
      });
      socket.on('run', (data) => {
        // TODO: step check?
        if (!data.error && activePipelines[data.runId]) {
          activePipelines[data.runId].state = 'recieved central node data';
          if (data.files) {
            // we've already recieved the files
            if (activePipelines[data.runId].files
              && activePipelines[data.runId].files.recieved
              && data.files.every(e => activePipelines[data.runId].files.recieved.includes(e))
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
            activePipelines[data.runId].remote.resolve(data.output);
          }
        } else if (data.error && activePipelines[data.runId]) {
          activePipelines[data.runId].state = 'recieved error';
          activePipelines[data.runId].remote.reject(Object.assign(new Error(), data.error));
        }
      });
      ss(socket).on('file', (stream, data) => {
        if (activePipelines[data.runId]) {
          const wStream = createWriteStream(
            path.join(activePipelines[data.runId].baseDirectory, data.file)
          );
          stream.pipe(wStream);
          wStream.on('close', () => {
            // mark off and start run?
            if (activePipelines[data.runId].files && activePipelines[data.runId].files.recieved) {
              activePipelines[data.runId].files.recieved.push(data.file);
            } else if (activePipelines[data.runId].files) {
              activePipelines[data.runId].files.recieved = [data.file];
            } else {
              activePipelines[data.runId].files = { recieved: [data.file] };
            }

            if (activePipelines[data.runId].files
              && activePipelines[data.runId].files.expected
              && activePipelines[data.runId].files.recieved
              && activePipelines[data.runId].currentInput
              && (activePipelines[data.runId].files.expected
                .every(e => activePipelines[data.runId].files.recieved.includes(e)))) {
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
        activePipelines[runId] = Object.assign(
          {
            state: 'created',
            pipeline: Pipeline.create(spec, runId, { mode, operatingDirectory, clientId }),
            baseDirectory: path.resolve(operatingDirectory, clientId, runId),
            outputDirectory: path.resolve(operatingDirectory, 'output', clientId, runId),
            cacheDirectory: path.resolve(operatingDirectory, 'cache', clientId, runId),
            transferDirectory: path.resolve(operatingDirectory, 'transfer', clientId, runId),
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
              [runId]: {},
            },
            remoteClients[client]
          );
        });

        const communicate = (pipeline, message) => {
          // TODO: hold the last step for drops, this only works for one step out
          // missedCache[pipeline.id] = {
          //   pipelineStep: pipeline.currentStep,
          //   controllerStep:
          // pipeline.pipelineSteps[pipeline.currentStep].controllerState.iteration,
          //   output: message,
          // };
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
              logger.silly('############ REMOTE OUT');
              logger.silly(JSON.stringify(message, null, 2));
              logger.silly('############ END REMOTE OUT');
              io.of('/').in(pipeline.id).clients((error, clients) => {
                if (error) throw error;
                readdir(activePipelines[pipeline.id].transferDirectory)
                  .then((files) => {
                    if (files && files.length !== 0) {
                      io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, output: message, files });
                      Object.keys(remoteClients).forEach((key) => {
                        if (clients.includes(remoteClients[key].socketId)) {
                          files.forEach((file) => {
                            const fsStream = createReadStream(
                              path.join(activePipelines[pipeline.id].transferDirectory, file)
                            );

                            const stream = ss.createStream();
                            ss(remoteClients[key].socket).emit('file', stream, {
                              id: clientId,
                              file,
                              runId: pipeline.id,
                            });
                            fsStream.pipe(stream);
                            stream.on('close', () => {
                              rimraf(
                                path.join(activePipelines[pipeline.id].transferDirectory, file)
                              );
                            });
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
              readdir(activePipelines[pipeline.id].transferDirectory)
                .then((files) => {
                  if (files && files.length !== 0) {
                    socket.emit('run', {
                      id: clientId, runId: pipeline.id, output: message, files,
                    });
                    files.forEach((file) => {
                      const fsStream = createReadStream(
                        path.join(activePipelines[pipeline.id].transferDirectory, file)
                      );

                      const stream = ss.createStream();
                      ss(socket).emit('file', stream, { id: clientId, file, runId: pipeline.id });
                      fsStream.pipe(stream);
                      stream.on('close', () => {
                        rimraf(path.join(activePipelines[pipeline.id].transferDirectory, file));
                      });
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
      waitingOnForRun,
    };
  },
};
