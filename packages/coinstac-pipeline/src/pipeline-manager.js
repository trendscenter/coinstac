'use strict';

const Pipeline = require('./pipeline');
const http = require('http');
const socketIO = require('socket.io');
const socketIOClient = require('socket.io-client');
const _ = require('lodash');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const path = require('path');

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
    mode,
    clientId,
    operatingDirectory = './',
    remotePort = 3500,
    remoteURL = 'http://localhost',
    authPlugin,
    authOpts,
    unauthHandler, // eslint-disable-line no-unused-vars
  }) {
    const activePipelines = {};
    let io;
    let socket;
    const remoteClients = {};
    const missedCache = {};

    const waitingOn = (runId) => {
      const waiters = [];
      for (let [key, val] of Object.entries(remoteClients)) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
        if (val[runId] && !val[runId].currentOutput) {
          waiters.push(key);
        }
      }
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
      io = socketIO(app);

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
          remoteClients[data.id].lastSeen = Math.floor(Date.now() / 1000);
        });

        socket.on('run', (data) => {
          // TODO: probably put in a 'pre-run' route?
          if (remoteClients[data.id]) {
            socket.join(data.runId);
            remoteClients[data.id][data.runId].currentOutput = data.output.output;
            remoteClients[data.id].lastSeen = Math.floor(Date.now() / 1000);
            activePipelines[data.runId].state = 'recieved client data';
            if (waitingOn(data.runId).length === 0) {
              activePipelines[data.runId].state = 'recieved all clients data';
              activePipelines[data.runId].remote.resolve({ output: aggregateRun(data.runId) });
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
      socket = socketIOClient(`${remoteURL}:${remotePort}?id=${clientId}`);
      socket.on('hello', () => {
        socket.emit('register', { id: clientId });
      });
      socket.on('run', (data) => {
        // TODO: step check?
        if (!data.error) {
          activePipelines[data.runId].state = 'recieved data';
          activePipelines[data.runId].remote.resolve(data.output);
        } else {
          activePipelines[data.runId].state = 'recieved error';
          activePipelines[data.runId].remote.reject(data.error);
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
        activePipelines[runId] = {
          state: 'created',
          pipeline: Pipeline.create(spec, runId, { mode, operatingDirectory }),
        };
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
            io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, output: message });
          } else {
            socket.emit('run', { id: clientId, runId: pipeline.id, output: message });
          }
        };

        const remoteHandler = ({ input, noop, transmitOnly }) => {
          let proxRes;
          let proxRej;

          const prom = new Promise((resolve, reject) => {
            proxRes = resolve;
            proxRej = reject;
          });
          activePipelines[runId].state = 'waiting for remote';
          activePipelines[runId].remote = {
            resolve: proxRes,
            error: proxRej,
          };
          if (!noop) {
            if (transmitOnly) {
              proxRes();
            }
            communicate(activePipelines[runId].pipeline, input);
          }
          return prom;
        };

        const pipelineProm = Promise.all([
          mkdirp(path.resolve(operatingDirectory, runId)),
          mkdirp(path.resolve(operatingDirectory, 'output', runId)),
          mkdirp(path.resolve(operatingDirectory, 'cache', runId)),
        ])
        .catch((err) => {
          throw new Error(`Unable to create pipeline directories: ${err}`);
        })
        .then(() => {
          activePipelines[runId].state = 'running';
          return activePipelines[runId].pipeline.run(remoteHandler)
          .then((res) => {
            activePipelines[runId].state = 'finished';
            return res;
          });
        });

        return { pipeline: activePipelines[runId].pipeline, result: pipelineProm };
      },
      getPipelineStateListener(runId) {
        if (!this.activePipelines[runId]) {
          throw new Error('invalid pipeline ID');
        }

        return this.activePipelines[runId].pipeline.stateEmitter;
      },
      waitingOn,
    };
  },
};
