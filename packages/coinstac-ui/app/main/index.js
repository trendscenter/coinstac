/**
 * Main process entry point.
 *
 * This script runs boot scripts in order, wiring up Electron's main process and
 * kicking off the render process (UI).
 */

'use strict';

const { compact } = require('lodash'); // eslint-disable-line no-unused-vars
const mock = require('../../test/e2e/mocks');
const electron = require('electron');
const ipcPromise = require('ipc-promise');
const ipcFunctions = require('./utils/ipc-functions');

const { ipcMain } = electron;

// if no env set prd
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Mock file dialogue in testing environment
// Watch the following issue for progress on dialog support
// https://github.com/electron/spectron/issues/94
if (process.env.NODE_ENV === 'test') {
  mock(electron.dialog);
}

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
const configureLogger = require('./utils/boot/configure-logger.js');
const upsertCoinstacUserDir = require('./utils/boot/upsert-coinstac-user-dir.js');
const loadConfig = require('../config.js');
const fileFunctions = require('./services/files.js');

// Boot up the main process
loadConfig()
.then(config =>
  Promise.all([
    config,
    configureLogger(config),
  ])
)
.then(([config, logger]) => {
  process.on('uncaughtException', logUnhandledError(null, logger));
  global.config = config;

  const mainWindow = getWindow();
  let core = null;
  logger.verbose('main process booted');

  ipcMain.on('clean-remote-pipeline', (event, runId) => {
    if (core) {
      core.unlinkFiles(runId);
    }
  });

  /**
   * IPC Listener to write logs
   * @param {String} message The message to write out to log
   * @param {String} type The type of log to write out
   */
  ipcMain.on('write-log', (event, { type, message }) => {
    logger[type](`process: render - ${message}`);
  });

  ipcPromise.on('login-init', (userId) => {
    return new Promise(res => res(configureCore(config, logger, userId)))
      .then((c) => {
        core = c;
        return upsertCoinstacUserDir(core);
      });
  });

  /**
   * IPC Listener to start pipeline
   * @param {Object} consortium
   * @param {String} consortium.id The id of the consortium starting the pipeline
   * @param {Object[]} consortium.pipelineSteps An array of the steps involved in
   *  this pipeline run according to the consortium
   * @param {String[]} filesArray An array of all the file locations used by this run
   * @param {Object} run
   * @param {String} run.id The id of the current run
   * @param {Object[]} run.pipelineSteps An array of the steps involved in this pipeline run
   *  according to the run
   * @return {Promise<String>} Status message
   */
  ipcMain.on('start-pipeline', (event, { consortium, pipeline, filesArray, run }) => {
    core.startPipeline(
      null,
      consortium.id,
      pipeline,
      filesArray,
      run.id,
      run.pipelineSteps
    )
    .then(([{ pipeline, result }]) => {
      // Listen for local pipeline state updates
      pipeline.stateEmitter.on('update', (data) => {
        mainWindow.webContents.send('local-pipeline-state-update', { run, data });
      });

      // Listen for results
      result.then((results) => {
        console.log('Pipeline is done. Result:'); // eslint-disable-line no-console
        console.log(results); // eslint-disable-line no-console
        core.unlinkFiles(run.id);
        if (run.type === 'local') {
          mainWindow.webContents.send('local-run-complete', {
            consName: consortium.name,
            run: Object.assign(run, { results, endDate: Date.now() }),
          });
        }
      });

      result.catch((error) => {
        core.unlinkFiles(run.id);
        mainWindow.webContents.send('local-run-error', {
          consName: consortium.name,
          run: Object.assign(run, { error, endDate: Date.now() }),
        });
      });
    });
  });

  /**
   * IPC listener to return a list of all local Docker images
   * @return {Promise<String[]>} An array of all local Docker image names
   */
  ipcPromise.on('get-all-images', () => {
    return core.computationRegistry.constructor.getImages()
      .then((data) => {
        return data;
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
    return core.computationRegistry.constructor
      .pullComputations(params.computations)
      .then((compStreams) => {
        let streamsComplete = 0;

        compStreams.forEach(({ compId, compName, stream }) => {
          if (typeof stream.on !== 'function') {
            const output = [{ message: stream.message, status: 'error', statusCode: stream.statusCode, isErr: true }];
            mainWindow.webContents.send('docker-out', { output, compId, compName });
          } else {
            stream.on('data', (data) => {
              let output = compact(data.toString().split('\r\n'));
              output = output.map(JSON.parse);
              if (output[0].error) {
                mainWindow.webContents.send('docker-out', { output: { Error: output[0].errorDetail.message }, compId, compName });
              } else {
                mainWindow.webContents.send('docker-out', { output, compId, compName });
              }
            });

            stream.on('close', () => {
              mainWindow.webContents.send('docker-out',
                {
                  output: [{ id: `${compId}-complete`, status: 'complete' }],
                  compId,
                  compName,
                }
              );

              streamsComplete += 1;

              if (params.consortiumId && streamsComplete === params.computations.length) {
                mainWindow.webContents
                  .send('docker-pull-complete', params.consortiumId);
              }
            });

            // TODO: may need to be removed once windows docker pulls no longer use plain http req
            if (process.platform === 'win32') {
              stream.on('end', () => {
                mainWindow.webContents.send('docker-out',
                  {
                    output: [{ id: `${compId}-complete`, status: 'complete' }],
                    compId,
                    compName,
                  }
                );

                streamsComplete += 1;

                if (params.consortiumId && streamsComplete === params.computations.length) {
                  mainWindow.webContents
                    .send('docker-pull-complete', params.consortiumId);
                }
              });
            }

            stream.on('error', (err) => {
              mainWindow.webContents.send('docker-out', { output: { Error: err }, compId, compName });
            });
          }
        });
      });
  });

  /**
   * IPC Listener to open a dialog in Electron
   * @param {String} org How the files being retrieved are organized
   * @return {String[]} List of file paths being retrieved
   */
  ipcPromise.on('open-dialog', (org) => {
    let filters;
    let properties;
    let postDialogFunc;

    if (org === 'metafile') {
      filters = [{
        name: 'CSV',
        extensions: ['csv', 'txt'],
      }];
      properties = ['openFile'];
      postDialogFunc = ipcFunctions.parseCSVMetafile;
    } else if (org === 'jsonschema') {
      filters = [{
        name: 'JSON Schema',
        extensions: ['json'],
      }];
      properties = ['openFile'];
      postDialogFunc = ipcFunctions.returnFileAsJSON;
    } else {
      filters = [
        {
          name: 'Images',
          extensions: ['jpeg', 'jpg', 'png'],
        },
        {
          name: 'Files',
          extensions: ['csv', 'txt', 'rtf'],
        },
      ];
      properties = ['openDirectory', 'openFile', 'multiSelections'];
      postDialogFunc = ipcFunctions.manualFileSelection;
    }

    return fileFunctions.showDialog(
      mainWindow,
      filters,
      properties
    )
      .then(filePaths => postDialogFunc(filePaths, core));
  });

  /**
   * IPC Listener to remove a Docker image
   * @param {String} imgId ID of the image to remove
   */
  ipcPromise.on('remove-image', (imgId) => {
    return core.computationRegistry.constructor.removeDockerImage(imgId);
  });
});
