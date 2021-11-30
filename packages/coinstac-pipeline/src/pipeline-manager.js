'use strict';

const fs = require('fs');
const mqtt = require('mqtt');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const path = require('path');
const http = require('http');
const https = require('https');
const FormData = require('form-data');
const archiver = require('archiver');
const Emitter = require('events');
const winston = require('winston');
const express = require('express');
const multer = require('multer');
const uuid = require('uuid/v4');
const tar = require('tar-fs');
const zlib = require('zlib');
const merge2 = require('merge2');
const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const debug = require('debug');
const mv = pify(require('mv'));
const Store = require('./io-store');

const debugProfile = debug('pipeline:profile');
const debugProfileClient = debug('pipeline:profile-client');

const {
  readdir,
  unlink,
} = fs.promises;

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
 * Takes an input stream and writes it to disk in
 * chunks specified by the chunk size
 * @param  {Object} stream      stream to split
 * @param  {string} filePath    destination
 * @param  {integer} chunkSize  split size
 * @return {Object}             Promise on output close
 */
const splitFilesFromStream = (stream, filePath, chunkSize) => {
  let currentChunk = 0;
  let currentChunkLen = 0;
  const asyncStreams = [];
  const splits = [];
  const newFileStream = fs.createWriteStream(
    `${filePath}.${currentChunk}`
  );
  splits[currentChunk] = {
    filePath: `${filePath}.${currentChunk}`,
    stream: newFileStream,
  };
  asyncStreams.push(new Promise((resolve, reject) => {
    splits[currentChunk].stream.on('close', () => resolve());
    splits[currentChunk].stream.on('error', e => reject(e));
  }));
  stream.on('data', (data) => {
    if (currentChunkLen >= chunkSize) {
      splits[currentChunk].stream.end();
      currentChunk += 1;
      const newFileStream = fs.createWriteStream(
        `${filePath}.${currentChunk}`
      );
      splits[currentChunk] = {
        filePath: `${filePath}.${currentChunk}`,
        stream: newFileStream,
      };
      asyncStreams.push(new Promise((resolve, reject) => {
        splits[currentChunk].stream.on('close', () => resolve());
        splits[currentChunk].stream.on('error', e => reject(e));
      }));
      splits[currentChunk].stream.write(data);
      currentChunkLen = data.length;
    } else {
      splits[currentChunk].stream.write(data);
      currentChunkLen += data.length;
    }
  });
  asyncStreams.push(new Promise((resolve, reject) => {
    stream.on('end', () => {
      splits[currentChunk].stream.end();
      resolve();
    });
    stream.on('error', (e) => {
      reject(e);
    });
  }));
  return Promise.all(asyncStreams)
    .then(() => splits.map(split => path.basename(split.filePath)));
};

const extractTar = (parts, outdir) => {
  return new Promise((resolve, reject) => {
    const unpack = merge2(...parts.map(part => fs.createReadStream(part)))
      .pipe(zlib.createGunzip())
      .pipe(tar.extract(outdir));
    unpack.on('finish', () => resolve());
    unpack.on('error', e => reject(e));
  });
};

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
    let io;
    let socket;
    let mqttClient;
    let mqttServer;
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

    const waitingOnForRun = (runId) => {
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
          )
        ) {
          waiters.push(clientId);
        }
      });

      return waiters;
    };

    const clearClientFileList = (runId) => {
      Object.keys(remoteClients).forEach((clientId) => {
        if (remoteClients[clientId][runId]) {
          remoteClients[clientId][runId].files = { received: [], expected: [] };
        }
      });
    };

    const printClientTimeProfiling = (runId, task) => {
      Object.keys(activePipelines[runId].clients).forEach((clientId) => {
        const currentClient = remoteClients[clientId][runId];
        if (currentClient) {
          const time = currentClient.debug.received - currentClient.debug.sent;
          currentClient.debug.profiling[task] = currentClient.debug.profiling[task]
            ? currentClient.debug.profiling[task] + time : time;
          debugProfileClient(`${task} took ${clientId}: ${time}ms`);
        }
      });
    };

    const publishData = (key, data, qos = 0) => {
      mqttClient.publish(
        key,
        JSON.stringify(data),
        { qos },
        (err) => { if (err) logger.error(`Mqtt error: ${err}`); }
      );
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
    } else {
      /**
       * Local node code
       */
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
      mqttClient,

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
            remote: { reject: () => {} }, // noop for pre pipe errors
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
         * Communicate with the with node(s), clients to remote or remote to clients
         * @param  {Object} pipeline pipeline to preform the messaging on
         * @param  {Object} message  data to serialize to recipient
         */
        activePipelines[runId].communicate = async (pipeline, success, messageIteration) => {
          const message = store.getAndRemove(pipeline.id, clientId);
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
                  publishData('run', {
                    id: clientId,
                    runId: pipeline.id,
                    error: `Error from central node ${e}`,
                    debug: { sent: Date.now() },
                  });
                });
            }
          // local client
          } else {
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
        };

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
            await activePipelines[runId].communicate(
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
          mkdirp(this.activePipelines[runId].baseDirectory),
          mkdirp(this.activePipelines[runId].outputDirectory),
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
        if (!this.activePipelines[runId]) {
          throw new Error('invalid pipeline ID');
        }

        return this.activePipelines[runId].stateEmitter;
      },
      suspendPipeline(runId) {
        const run = this.activePipelines[runId];
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
        const run = this.activePipelines[runId];

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