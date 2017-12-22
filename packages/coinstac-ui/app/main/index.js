/**
 * Main process entry point.
 *
 * This script runs boot scripts in order, wiring up Electron's main process and
 * kicking off the render process (UI).
 */

'use strict';

const { compact } = require('lodash');
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
  return Promise.all([
    logger,
    configureCore(config, logger),
  ]);
})
.then(([logger, core]) =>
  Promise.all([
    logger,
    core,
    upsertCoinstacUserDir(core),
  ])
)
.then(([logger, core]) => {
  const mainWindow = getWindow();
  logger.verbose('main process booted');

  ipcMain.on('write-log', (event, { type, message }) => {
    logger[type](`process: render - ${message}`);
  });

  ipcPromise.on('start-pipeline', ({ consortium, filesArray, run }) => {
    return core.constructor.startPipeline(
      consortium.id, consortium.pipelineSteps, filesArray, run.id, run.pipelineSteps
    );
  });

  ipcPromise.on('download-comps', (params) => {
    return core.computationRegistry
      .pullPipelineComputations({ comps: params })
      .then((pullStreams) => {
        pullStreams.on('data', (data) => {
          let output = compact(data.toString().split('\r\n'));
          output = output.map(JSON.parse);
          mainWindow.webContents.send('docker-out', output);
        });

        pullStreams.on('close', (code) => {
          return code;
        });

        pullStreams.on('error', (err) => {
          return err;
        });
      });
  });

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
});
