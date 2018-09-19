'use strict';

const Pipeline = require('./pipeline');
const http = require('http');
const socketIO = require('socket.io');
const socketIOClient = require('socket.io-client');
const _ = require('lodash');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const path = require('path');
const readdir = promisify(require('fs').readdir);
const Emitter = require('events');
const winston = require('winston');
const ss = require('socket.io-stream');
const { createReadStream, createWriteStream } = require('fs');

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
logger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';

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
    const missedCache = {};

    const waitingOnForRun = (runId) => {
      const waiters = [];
      activePipelines[runId].clients.forEach((client) => {
        if (remoteClients[client][runId] && !remoteClients[client][runId].currentOutput) {
          waiters.push(client);
        }
      });

      return waiters;
    };

    const aggregateRun = (runId) => {
      return _.reduce(remoteClients, (memo, client, id) => {
        if (client[runId]) {
          memo[id] = client[runId].currentOutput;
          client[runId].previousOutput = client[runId].currentOutput;
          client[runId].currentOutput = undefined;
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

                if (activePipelines[data.runId].state !== 'pre-pipeline') {
                  const waitingOn = waitingOnForRun(data.runId);
                  activePipelines[data.runId].currentState.waitingOn = waitingOn;
                  activePipelines[data.runId].stateEmitter
                  .emit('update',
                    Object.assign(
                      {},
                      activePipelines[data.runId].pipeline.currentState,
                      activePipelines[data.runId].currentState
                    )
                  );

                  if (waitingOn.length === 0) {
                    activePipelines[data.runId].state = 'recieved all clients data';
                    const agg = aggregateRun(data.runId);
                    logger.silly('Received all client data');
                    activePipelines[data.runId].remote.resolve({ output: agg });
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
          activePipelines[data.runId].remote.resolve(data.output);
        } else if (data.error && activePipelines[data.runId]) {
          activePipelines[data.runId].state = 'recieved error';
          activePipelines[data.runId].remote.reject(Object.assign(new Error(), data.error));
        }
      });
      ss(socket).on('stderr', (stream, data) => {
        const wStream = createWriteStream(activePipelines[data.runId].baseDirectory);
        stream.pipe(wStream)
        wStream.on('close', () => {
          // mark off and start run?
        });
        wStream.on('error', () => {
          // reject pipe
        })

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
          // hold the last step for drops, this only works for one step out
          missedCache[pipeline.id] = {
            pipelineStep: pipeline.currentStep,
            controllerStep: pipeline.pipelineSteps[pipeline.currentStep].controllerState.iteration,
            output: message,
          };
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
                readdir(activePipelines[pipeline.id].base)
                .then((files) => {
                  if (files) {
                    io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, output: message, files });
                    Object.keys(remoteClients).forEach((key) => {
                      if (clients.includes(remoteClients[key].socketId)) {
                        files.forEach((file) => {
                          const fsStream = createReadStream(file);

                          const stream = ss.createStream();
                          ss(remoteClients[key].socket).emit('file', stream, { file, runId: pipeline.id });
                          fsStream.pipe(stream);
                        });
                      }
                    });
                  } else {
                    io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, output: message });
                  }
                });
              });
            }
          } else {
            if (message instanceof Error) { // eslint-disable-line no-lonely-if
              socket.emit('run', { id: clientId, runId: pipeline.id, error: message });
            } else {
              socket.emit('run', { id: clientId, runId: pipeline.id, output: message });
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
              )
            );

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
