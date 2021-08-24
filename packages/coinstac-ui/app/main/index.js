/**
 * Main process entry point.
 *
 * This script runs boot scripts in order, wiring up Electron's main process and
 * kicking off the render process (UI).
 */

'use strict';

Error.stackTraceLimit = 100;

const { compact } = require('lodash'); // eslint-disable-line no-unused-vars
const electron = require('electron');
const ipcPromise = require('ipc-promise');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const ipcFunctions = require('./utils/ipc-functions');
const runPipelineFunctions = require('./utils/run-pipeline-functions');

const { ipcMain } = electron;

const { EXPIRED_TOKEN, BAD_TOKEN } = require('../render/utils/error-codes');

// if no env set prd
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Set up root paths
require('../common/utils/add-root-require-path.js');

// Parse and handle CLI flags
const parseCLIInput = require('./utils/boot/parse-cli-input.js');

parseCLIInput();

// Add dev mode specific services
require('./utils/boot/configure-dev-services.js');

// Load the UI
const getWindow = require('./utils/boot/configure-browser-window.js');

// Set up error handling
const logUnhandledError = require('../common/utils/log-unhandled-error.js');
const configureCore = require('./utils/boot/configure-core.js');
const { configureLogger, readInitialLogContents } = require('./utils/boot/configure-logger.js');
const upsertCoinstacUserDir = require('./utils/boot/upsert-coinstac-user-dir.js');
const loadConfig = require('../config.js');
const fileFunctions = require('./services/files.js');


const getAllFilesInDirectory = (directory) => {
  const dirents = fs.readdirSync(directory, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(directory, dirent.name);
    return dirent.isDirectory() ? getAllFilesInDirectory(res) : res;
  });
  return Array.prototype.concat(...files);
};

let initializedCore;
// Boot up the main process
loadConfig()
  .then(config => Promise.all([
    config,
    configureLogger(config),
  ]))
  .then(([config, logger]) => {
    const unhandler = logUnhandledError(null, logger);
    process.on('uncaughtException', (err) => {
      try {
        unhandler(err);
      } catch (e) {
        console.error('Logging failure:');// eslint-disable-line no-console
        console.error(e);// eslint-disable-line no-console
        console.error('Thrown error on failure:');// eslint-disable-line no-console
        console.error(err);// eslint-disable-line no-console
      }
    });
    process.on('unhandledRejection', (err) => {
      try {
        unhandler(err);
      } catch (e) {
        console.error('Logging failure:');// eslint-disable-line no-console
        console.error(e);// eslint-disable-line no-console
        console.error('Thrown error on failure:');// eslint-disable-line no-console
        console.error(err);// eslint-disable-line no-console
      }
    });
    global.config = config;

    const mainWindow = getWindow();
    logger.verbose('main process booted');

    mainWindow.webContents.on('new-window', (e, url) => {
      e.preventDefault();
      electron.shell.openExternal(url);
    });

    logger.on('log-message', (arg) => {
      mainWindow.webContents.send('log-message', arg);
    });

    ipcMain.on('load-initial-log', async () => {
      const fileContents = await readInitialLogContents(config);
      mainWindow.webContents.send('log-message', { data: fileContents });
    });

    ipcMain.on('clean-remote-pipeline', (event, runId) => {
      if (initializedCore) {
        initializedCore.unlinkFiles(runId)
          .catch((err) => {
            logger.error(err);
            mainWindow.webContents.send('docker-error', {
              err: {
                message: err.message,
                stack: err.stack,
              },
            });
          });
      }
    });

    /**
   * IPC Listener to write logs
   * @param {String} message The message to write out to log
   * @param {String} type The type of log to write out
   */
    ipcMain.on('write-log', (event, { type, message }) => {
      logger[type](`process: render - ${JSON.stringify(message)}`);
    });

    /**
     * IPC Listener to notify token expire
     */
    ipcMain.on(EXPIRED_TOKEN, () => {
      mainWindow.webContents.send(EXPIRED_TOKEN);
    });

    ipcMain.on(BAD_TOKEN, () => {
      logger.error('A bad token was used on a request to the api');

      mainWindow.webContents.send(BAD_TOKEN);
    });

    /**
     * IPC Listener to prepare consortia files
     */
    ipcMain.on('prepare-consortia-files', async (event, { userId, fileTree, appDirectory }) => {
      const userRunDirectory = path.join(appDirectory, 'runs', userId);

      if (!fs.existsSync(userRunDirectory)) {
        fs.mkdirSync(userRunDirectory, { recursive: true });
      }

      const res = [];

      fileTree.forEach((consortium) => {
        const consortiumDirectory = path.join(userRunDirectory, consortium.name);

        if (!fs.existsSync(consortiumDirectory)) {
          fs.mkdirSync(consortiumDirectory);
        }

        consortium.runs.forEach((run) => {
          const runDirectory = path.join(
            consortiumDirectory,
            `${run.pipelineName} - ${run.id} - ${moment(run.endDate).format('YYYY-MM-DD')}`
          );

          if (!fs.existsSync(runDirectory)) {
            fs.mkdirSync(runDirectory, { recursive: true });
          }

          const outputDirectory = path.join(appDirectory, 'output', userId, run.id);

          if (fs.existsSync(outputDirectory)) {
            const allFiles = getAllFilesInDirectory(outputDirectory);

            allFiles.forEach((file) => {
              const relativePath = path.relative(outputDirectory, file);
              const symlinkPath = path.join(runDirectory, relativePath);

              const symlinkDirectory = path.dirname(symlinkPath);

              if (!fs.existsSync(symlinkDirectory)) {
                fs.mkdirSync(symlinkDirectory, { recursive: true });
              }

              if (!fs.existsSync(symlinkPath)) {
                fs.symlinkSync(file, symlinkPath);
              }

              const createdSymlinkPath = path
                .relative(appDirectory, symlinkPath)
                .replace(`runs${path.sep}${userId}${path.sep}`, '');

              res.push(createdSymlinkPath);
            });
          }
        });
      });

      mainWindow.webContents.send('prepare-consortia-files', res);
    });

    ipcPromise.on('login-init', ({
      userId, appDirectory, clientServerURL, token,
    }) => {
      return initializedCore
        ? Promise.resolve()
        : configureCore(
          config,
          logger,
          userId,
          appDirectory || config.get('coinstacHome'),
          clientServerURL || config.get('clientServerURL'),
          token
        )
          .then((c) => {
            initializedCore = c;
            return upsertCoinstacUserDir(c);
          });
    });

    /**
     * [initializedCore description]
     * @type {[type]}
     */
    ipcPromise.on('logout', () => {
      mainWindow.webContents.send('logout');

      // TODO: hacky way to not get a mqtt reconnn loop
      // a better way would be to make an actual shutdown fn for pipeline
      return new Promise((resolve) => {
        initializedCore.pipelineManager.mqttClient.end(true, () => {
          initializedCore = undefined;
          resolve();
        });
      });
    });

    ipcPromise.on('set-client-server-url', url => new Promise((resolve) => {
      initializedCore.setClientServerURL(url);
      resolve();
    }));

    function startPipelineRun(run, filesArray, consortium, networkVolume) {
      const pipeline = run.pipelineSnapshot;

      const computationImageList = pipeline.steps
        .map(step => step.computations
          .map(comp => comp.computation.dockerImage))
        .reduce((acc, val) => acc.concat(val), []);

      return initializedCore.Manager.pullImagesFromList(computationImageList)
        .then((compStreams) => {
          const streamProms = [];

          compStreams.forEach(({ stream }) => {
            let proxRes;
            let proxRej;

            streamProms.push(new Promise((resolve, reject) => {
              proxRej = reject;
              proxRes = resolve;
            }));
            if (typeof stream.on !== 'function') {
              proxRej(stream.message);
            } else {
              mainWindow.webContents.send('local-pipeline-state-update', {
                run,
                data: { controllerState: 'Downloading required docker images' },
              });

              stream.on('data', (data) => {
                mainWindow.webContents.send('local-pipeline-state-update', {
                  run,
                  data: { controllerState: `Downloading required docker images\n ${data.toString()}` },
                });
              });

              stream.on('end', () => {
                proxRes();
              });

              stream.on('error', (err) => {
                proxRej(err);
              });
            }
          });

          return Promise.all(streamProms);
        })
        .catch((err) => {
          return initializedCore.unlinkFiles(run.id)
            .then(() => {
              mainWindow.webContents.send('local-run-error', {
                consName: consortium.name,
                run: Object.assign(
                  run,
                  {
                    error: {
                      message: err.message,
                      stack: err.stack,
                      error: err.error,
                    },
                    endDate: Date.now(),
                  }
                ),
              });
            });
        })
        .then(() => initializedCore.Manager.pruneImages())
        .then(() => {
          logger.verbose('############ Client starting pipeline');

          const pipelineName = pipeline.name;
          const consortiumName = consortium.name;

          ipcFunctions.sendNotification(
            'Pipeline started',
            `Pipeline ${pipelineName} started on consortia ${consortiumName}`
          );

          return initializedCore.startPipeline(
            null,
            consortium.id,
            pipeline,
            filesArray,
            run.id,
            run.pipelineSteps,
            networkVolume
          )
            .then(({ pipeline, result }) => {
              // Listen for local pipeline state updates
              pipeline.stateEmitter.on('update', (data) => {
                mainWindow.webContents.send('local-pipeline-state-update', { run, data });
              });

              // Listen for results
              return result.then((results) => {
                logger.verbose('########### Client pipeline done');

                ipcFunctions.sendNotification(
                  'Pipeline finished',
                  `Pipeline ${pipelineName} finished on consortia ${consortiumName}`
                );

                return initializedCore.unlinkFiles(run.id)
                  .then(() => {
                    if (run.type === 'local') {
                      mainWindow.webContents.send('local-run-complete', {
                        consName: consortium.name,
                        run: Object.assign(run, { results, endDate: Date.now() }),
                      });
                    }
                  });
              })
                .catch((error) => {
                  logger.verbose('########### Client pipeline error');
                  logger.verbose(error.message);

                  ipcFunctions.sendNotification(
                    'Pipeline stopped',
                    `Pipeline ${pipelineName} stopped on consortia ${consortiumName}`
                  );

                  return initializedCore.unlinkFiles(run.id)
                    .then(() => {
                      mainWindow.webContents.send('local-run-error', {
                        consName: consortium.name,
                        run: Object.assign(
                          run,
                          {
                            error: {
                              message: error.message,
                              stack: error.stack,
                              error: error.error,
                              input: error.input,
                            },
                            endDate: Date.now(),
                          }
                        ),
                      });
                    });
                });
            })
            .catch((error) => {
              mainWindow.webContents.send('local-run-error', {
                consName: consortium.name,
                run: Object.assign(
                  run,
                  {
                    error: {
                      message: error.message,
                      stack: error.stack,
                      error: error.error,
                    },
                    endDate: Date.now(),
                  }
                ),
              });
            });
        });
    }

    async function startPipeline(consortium, dataMappings, pipelineRun, networkVolume) {
      try {
        const { filesArray, steps } = runPipelineFunctions.parsePipelineInput(
          pipelineRun.pipelineSnapshot, dataMappings
        );
        const run = {
          ...pipelineRun,
          pipelineSnapshot: {
            ...pipelineRun.pipelineSnapshot,
            steps,
          },
        };

        mainWindow.webContents.send('save-local-run', { run: pipelineRun });

        await startPipelineRun(run, filesArray, consortium, networkVolume);
      } catch (error) {
        mainWindow.webContents.send('notify-warning', error.message);
      }
    }

    /**
   * IPC Listener to start pipeline
   * @param {Object} consortium Consortium starting the pipeline
   * @param {Object} dataMappings Mapping of pipeline variables into data file columns
   * @param {Object} pipelineRun Current run details
   * @return {Promise<String>} Status message
   */
    ipcMain.on('start-pipeline', (event, {
      consortium, dataMappings, pipelineRun, networkVolume,
    }) => {
      // This is a way to avoid multiple instances of COINSTAC running on the same machine to start
      // the pipeline runs at the same time. We start the pipeline runs with random delays
      // between 0 and 3000ms.
      const delayAmount = Math.floor(Math.random() * 3000);

      setTimeout(() => {
        startPipeline(consortium, dataMappings, pipelineRun, networkVolume);
      }, delayAmount);
    });

    /**
     * IPC Listener to stop pipeline
     * @param {String} pipelineId The id of the pipeline currently running
     * @param {String} runId The id of the pipeline run
     * @return {Promise<String>} Status message
     */
    ipcMain.on('stop-pipeline', (event, { pipelineId, runId }) => {
      try {
        return initializedCore.requestPipelineStop(pipelineId, runId);
      } catch (err) {
        logger.error(err);
        mainWindow.webContents.send('docker-error', {
          err: {
            message: err.message,
            stack: err.stack,
          },
        });
      }
    });

    /**
  * IPC listener to return a list of all local Docker images
  * @return {Promise<String[]>} An array of all local Docker image names
  */
    ipcPromise.on('get-all-images', () => {
      return initializedCore.Manager.getImages()
        .then((data) => {
          return data;
        })
        .catch((err) => {
          logger.error(err);
          mainWindow.webContents.send('docker-error', {
            err: {
              message: err.message,
              stack: err.stack,
            },
          });
        });
    });


    /**
  * IPC listener to return status of Docker
  * @return {Promise<boolean[]>} Docker running?
  */
    ipcPromise.on('get-status', () => {
      return initializedCore.Manager.getStatus()
        .then((result) => {
          return result;
        })
        .catch((err) => {
          logger.error(err);
          mainWindow.webContents.send('docker-error', {
            err: {
              message: err.message,
              stack: err.stack,
            },
          });
        });
    });

    /**
  * IPC Listener to download a list of computations
  * @param {Object} params
  * @param {String[]} params.computations An array of docker image names
  * @param {String} params.consortiumId ID of the consortium, if relevant,
  *  associated with the computations being retrieved
  * @return {Promise}
  */
    ipcPromise.on('download-comps', (params) => { // eslint-disable-line no-unused-vars
      return initializedCore.Manager
        .pullImages(params.computations)
        .then((compStreams) => {
          let streamsComplete = 0;

          compStreams.forEach(({ compId, compName, stream }) => {
            if (typeof stream.on !== 'function') {
              const output = [{
                message: stream.message, status: 'error', statusCode: stream.statusCode, isErr: true,
              }];
              mainWindow.webContents.send('docker-out', { output, compId, compName });
            } else {
              stream.on('data', (data) => {
                let output = compact(data.toString().split('\r\n'));
                output = output.map(JSON.parse);

                mainWindow.webContents.send('docker-out', { output, compId, compName });
              });

              stream.on('end', () => {
                mainWindow.webContents.send('docker-out',
                  {
                    output: [{ id: `${compId}-complete`, status: 'complete' }],
                    compId,
                    compName,
                  });

                streamsComplete += 1;

                if (params.consortiumId && streamsComplete === params.computations.length) {
                  mainWindow.webContents
                    .send('docker-pull-complete', params.consortiumId);
                }
              });

              stream.on('error', (err) => {
                const output = [{
                  message: err.json, status: 'error', statusCode: err.statusCode, isErr: true,
                }];
                mainWindow.webContents.send('docker-out', { output, compId, compName });
              });
            }
          });
        })
        .catch((err) => {
          const output = [{
            message: err.json, status: 'error', statusCode: err.statusCode, isErr: true,
          }];
          mainWindow.webContents.send('docker-out', { output });
        });
    });

    /**
   * IPC Listener to open a dialog in Electron
   * @param {String} org How the files being retrieved are organized
   * @return {String[]} List of file paths being retrieved
  */
    ipcPromise.on('open-dialog', ({ org, filters, properties }) => {
      let dialogFilters;
      let dialogProperties;
      let postDialogFunc;

      if (org === 'jsonschema') {
        dialogFilters = [{
          name: 'JSON Schema',
          extensions: ['json'],
        }];
        dialogProperties = ['openFile'];
        postDialogFunc = ipcFunctions.returnFileAsJSON;
      } else if (org === 'directory') {
        dialogProperties = ['openDirectory'];
        postDialogFunc = ipcFunctions.manualDirectorySelection;
      } else {
        dialogFilters = filters;
        dialogProperties = properties;
        postDialogFunc = ipcFunctions.manualDirectorySelection;
      }

      return fileFunctions.showDialog(
        mainWindow,
        dialogFilters,
        dialogProperties
      )
        .then(({ filePaths }) => postDialogFunc(filePaths, initializedCore));
    });
    /**
   * IPC Listener to remove a Docker image
   * @param {String} imgId ID of the image to remove
   */
    ipcPromise.on('remove-image', ({ compId, imgId, imgName }) => {
      return initializedCore.Manager.removeImage(imgId)
        .catch((err) => {
          const output = [{
            message: err.message, status: 'error', statusCode: err.statusCode, isErr: true,
          }];
          mainWindow.webContents.send('docker-out', { output, compId, compName: imgName });
        });
    });
  });
