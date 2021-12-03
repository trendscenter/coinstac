'use strict';

const fs = require('fs');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const path = require('path');
const http = require('http');
const https = require('https');
const FormData = require('form-data');
const Emitter = require('events');
const winston = require('winston');
const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const debug = require('debug');
const Store = require('./io-store');
const setupCentral = require('./setup-central');
const setupOuter = require('./setup-outer');

const debugProfile = debug('pipeline:profile');
const debugProfileClient = debug('pipeline:profile-client');

winston.loggers.add('pipeline', {
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});
const defaultLogger = winston.loggers.get('pipeline');
defaultLogger.level = process.LOGLEVEL ? process.LOGLEVEL : 'info';

const Pipeline = require('./pipeline');

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
    imageDirectory = './',
    logger,
    operatingDirectory = './',
    mode,
    remotePathname = '/transfer',
    remotePort = 3300,
    remoteProtocol = 'http:',
    mqttRemotePort = 1883,
    mqttRemoteWSPort = 9001,
    mqttRemoteProtocol = 'mqtt:',
    mqttRemoteWSProtocol = 'ws:',
    mqttRemoteWSPathname = '',
    remoteURL = 'localhost',
    mqttRemoteURL = 'localhost',
    unauthHandler, // eslint-disable-line no-unused-vars
  }) {
    const store = Store.init(clientId);
    const activePipelines = {};
    let mqttClient; // eslint-disable-line no-unused-vars
    let mqttServer;
    let communicate;
    let publishData;
    let waitingOnForRun;
    const remoteClients = {};
    const request = remoteProtocol.trim() === 'https:' ? https : http;
    logger = logger || defaultLogger;
    debugProfileClient.log = l => logger.info(`PROFILING: ${l}`);
    debugProfile.log = l => logger.info(`PROFILING: ${l}`);

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
            logger.silly(`############# ZIPPED FILE SIZE: ${fs.statSync(path.join(directory, file)).size / 1048576}`);
            const form = new FormData();
            form.append('filename', file);
            form.append('compressed', compressed.toString());
            form.append('files', JSON.stringify(files));
            form.append('clientId', clientId);
            form.append('runId', runId);
            form.append('file', fs.createReadStream(
              path.join(directory, file),
              {
                headers: { 'transfer-encoding': 'chunked' },
                knownSize: NaN,
              }
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
        }, 5000 * factor);
      });
    };

    /**
     *  transfer a file to or from the remote
     * @param  {string} method   POST or GET
     * @param  {integer} limit   retry limit for an unreachable host
     * @param  {Array} files     files to send or receive
     * @param  {string} clientId this clients id
     * @param  {string} runId    the run context for the files
     * @return {Promise}         Promise when the files are received,
     *                           the action fails besides ECONNREFUSED,
     *                           or the limit is reached
     */
    const transferFiles = async (method, limit, files, clientId, runId, directory) => {
      logger.silly(`Sending ${files.length} files`);
      return Promise.all(files.reduce((memo, file, index) => {
        memo.push((async () => {
          let retryLimit = 0;
          let success = false;
          let partFile;
          // retry 1000 times w/ backout
          while (retryLimit < limit) {
            try {
              partFile = await exponentialRequest( // eslint-disable-line no-await-in-loop, max-len
                method,
                retryLimit,
                file,
                clientId,
                runId,
                directory,
                true
              );
              success = true;
              break;
            } catch (e) {
              logger.silly(JSON.stringify(e));
              if ((e.code
                && (
                  e.code === 'ECONNREFUSED'
                  || e.code === 'EPIPE'
                  || e.code === 'ECONNRESET'
                  || e.code === 'EAGAIN'
                ))
                || (e.message && e.message.includes('EPIPE'))
              ) {
                retryLimit += 1;
                logger.silly(`Retrying file request: ${file}`);
                logger.silly(`File request failed with: ${e.message}`);
              } else {
                throw e;
              }
            }
          }
          if (!success) throw new Error('Service down, file retry limit reached');
          logger.silly(`Successfully sent file ${index}`);
          return partFile;
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
        rmrf(path.resolve(activePipelines[runId].transferDirectory)),
        rmrf(path.resolve(activePipelines[runId].systemDirectory)),
      ]).then(() => {
        delete activePipelines[runId];
        Object.keys(remoteClients).forEach((clientId) => {
          if (remoteClients[clientId][runId]) {
            delete remoteClients[clientId][runId];
          }
        });
      });
    };


    const clientPublish = (clients, data, opts) => {
      Object.keys(clients).forEach((clientId) => {
        if (opts && opts.success && opts.limitOutputToOwner) {
          if (clientId === opts.owner) {
            mqttServer.publish(`${clientId}-run`, JSON.stringify(data), { qos: 1 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
          } else {
            const limitedData = Object.assign({}, data, { files: undefined, output: { success: true, output: { message: 'output sent to consortium owner' } } });
            mqttServer.publish(`${clientId}-run`, JSON.stringify(limitedData), { qos: 1 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
          }
        } else {
          mqttServer.publish(`${clientId}-run`, JSON.stringify(data), { qos: 0 }, (err) => { if (err) logger.error(`Mqtt error: ${err}`); });
        }
      });
    };

    // TODO: secure socket layer

    if (mode === 'remote') {
      ({ mqttServer, communicate, waitingOnForRun } = await setupCentral({
        logger,
        activePipelines,
        remoteClients,
        clientPublish,
        cleanupPipeline,
        mqttRemoteProtocol,
        mqttRemoteURL,
        mqttRemotePort,
        clientId,
        store,
        remotePort,
        debugProfileClient,
      }));
    } else {
      ({ mqttClient, communicate, publishData } = await setupOuter({
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
      }));
    }


    return {
      /**
       * Starts a pipeline given a pipeline spec, client list and unique ID
       * for that pipeline. The return object is that pipeline and a promise that
       * resolves to the final output of the pipeline.
       * @param  {Object} spec         a valid pipeline specification
       * @param  {Array}  clients={} a list of client IDs particapating in pipeline
       *                               only necessary for decentralized runs
       * @param  {String} runId        unique ID for the pipeline
       * @return {Object}              an object containing the active pipeline and
       *                               Promise for its result
       */
      startPipeline({
        spec,
        clients = {},
        runId,
        alternateInputDirectory,
        saveState,
      }) {
        let pipelineStartTime;
        store.put(`${runId}-profiling`, clientId, {});
        if (mode === 'remote') pipelineStartTime = Date.now();
        if (activePipelines[runId] && activePipelines[runId].state !== 'pre-pipeline') {
          throw new Error('Duplicate pipeline started');
        }

        const userDirectories = {
          baseDirectory: path.resolve(operatingDirectory, 'input', clientId, runId),
          outputDirectory: path.resolve(operatingDirectory, 'output', clientId, runId),
          transferDirectory: path.resolve(operatingDirectory, 'transfer', clientId, runId),
        };
        activePipelines[runId] = Object.assign(
          {
            state: 'created',
            pipeline: Pipeline.create(spec, runId, {
              mode,
              imageDirectory,
              operatingDirectory,
              alternateInputDirectory,
              clientId,
              userDirectories,
              owner: spec.owner,
              logger,
            }),
            baseDirectory: path.resolve(operatingDirectory, 'input', clientId, runId),
            outputDirectory: userDirectories.outputDirectory,
            transferDirectory: userDirectories.transferDirectory,
            systemDirectory: path.resolve(operatingDirectory, 'system', clientId, runId),
            stateEmitter: new Emitter(),
            currentState: {},
            stashedOuput: undefined,
            communicate: undefined,
            clients,
            remote: { reject: () => { } }, // noop for pre pipe errors
            owner: spec.owner,
            limitOutputToOwner: spec.limitOutputToOwner,
            debug: {},
          },
          activePipelines[runId],
          saveState ? saveState.activePipeline : {}
        );

        // remote client object creation
        Object.keys(clients).forEach((clientId) => {
          remoteClients[clientId] = Object.assign(
            {
              id: clientId,
              username: clients[clientId],
              state: 'unregistered',
              [runId]: {
                state: {},
                files: { expected: [], received: [] },
                debug: { profiling: {} },
              },
            },
            remoteClients[clientId]
          );
        });

        if (mode === 'local') {
          activePipelines[runId].registered = false;
          publishData('register', { id: clientId, runId });
        }


        /**
         * callback fn passed down to facilitate external communication
         * @param  {[type]} success      informs transmission of completion
         * @param  {[type]} noop         do nothing but resolve
         * @param  {[type]} transmitOnly send without input
         * @param  {[type]} iteration    the iteration for the input
         * @return {[type]}              Promise when we get a response
         */
        const remoteHandler = async ({
          success, noop, transmitOnly, iteration, callback,
        }) => {
          activePipelines[runId].remote = {
            resolve: callback.bind(null, null),
            reject: callback,
          };
          if (!noop) {
            await communicate(
              activePipelines[runId].pipeline,
              success,
              iteration
            );
            // only send out results, don't wait
            // this allows the last remote iteration to just finish
            if (transmitOnly) {
              callback();
            }

            if (mode === 'remote') activePipelines[runId].state = 'running';
          } else if (activePipelines[runId].state === 'created') {
            activePipelines[runId].state = 'running';
            Object.keys(activePipelines[runId].clients).forEach((clientId) => {
              mqttServer.publish(`${clientId}-register`, JSON.stringify({ runId }));
            });
          }
        };

        const pipelineProm = Promise.all([
          mkdirp(activePipelines[runId].baseDirectory),
          mkdirp(activePipelines[runId].outputDirectory),
          mkdirp(activePipelines[runId].transferDirectory),
          mkdirp(activePipelines[runId].systemDirectory),
        ])
          .catch((err) => {
            throw new Error(`Unable to create pipeline directories: ${err}`);
          })
          .then(() => {
            activePipelines[runId].pipeline.stateEmitter.on('update',
              data => activePipelines[runId].stateEmitter
                .emit('update', Object.assign({}, data, activePipelines[runId].currentState)));

            return activePipelines[runId].pipeline.run(remoteHandler)
              .then((res) => {
                activePipelines[runId].state = 'finished';
                return res;
              });
          }).then((res) => {
            if (mode === 'remote') {
              debugProfile('**************************** Profiling totals ***************************');
              const totalTime = Date.now() - pipelineStartTime;
              Object.keys(activePipelines[runId].clients).forEach((clientId) => {
                Object.keys(remoteClients[clientId][runId].debug.profiling).forEach((task) => {
                  debugProfile(`Total ${task} time for ${clientId} took: ${remoteClients[clientId][runId].debug.profiling[task]}ms`);
                });
              });
              debugProfile(`Total pipeline time: ${totalTime}ms`);
            }
            if (!activePipelines[runId].finalTransferList
              || Object.keys(activePipelines[runId].clients)
                .every(clientId => activePipelines[runId].finalTransferList.has(clientId))
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
          })
          .catch((err) => {
            if (mode === 'remote' || err.message.includes('Pipeline operation suspended by user')) {
              if (mode === 'remote') {
                clientPublish(
                  activePipelines[runId].clients,
                  { runId, error: err }
                );
              }
              return cleanupPipeline(runId)
                .then(() => {
                  throw err;
                });
            }
            // local pipeline user stop error, or other uncaught error
            publishData('run', {
              id: clientId, runId, error: { message: err.message, stack: err.stack },
            }, 1);
            cleanupPipeline(runId)
              .then(() => {
                throw err;
              });
          });

        return {
          pipeline: activePipelines[runId].pipeline,
          result: pipelineProm,
          stateEmitter: activePipelines[runId].stateEmitter,
        };
      },
      getPipelineStateListener(runId) {
        if (!activePipelines[runId]) {
          throw new Error('invalid pipeline ID');
        }

        return activePipelines[runId].stateEmitter;
      },
      suspendPipeline(runId) {
        const run = activePipelines[runId];
        const packagedState = {
          activePipelineState: {
            currentState: run.currentState,
          },
          pipelineState: {
            currentStep: run.pipeline.currentStep,
          },
          controllerState: run.pipeline.pipelineSteps[run.pipeline.currentStep].controllerState,
        };
        return this.stopPipeline(runId, 'suspend')
          .then(output => Object.assign({ output }, packagedState));
      },
      async stopPipeline(runId, type = 'user') {
        const run = activePipelines[runId];

        if (!run) {
          throw new Error('Invalid pipeline ID');
        }

        const currentStepNumber = run.pipeline.currentStep;
        const currentStep = run.pipeline.pipelineSteps[currentStepNumber];

        if (currentStep) {
          return currentStep.stop(type);
        }
      },
      waitingOnForRun,
    };
  },
};
