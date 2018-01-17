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

// if no env set prd
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Mock file dialogue in testing environment
// Watch the following issue for progress on dialog support
// https://github.com/electron/spectron/issues/94
if (process.env.NODE_ENV === 'test') {
  mock(electron.dialog);
}

// Set up error handling
require('./utils/boot/configure-uncaught-exceptions.js');

// Set up root paths
require('../common/utils/add-root-require-path.js');

// Parse and handle CLI flags
const parseCLIInput = require('./utils/boot/parse-cli-input.js');

parseCLIInput();

// Add dev mode specific services
require('./utils/boot/configure-dev-services.js');

// Set up logging
const configureLogger = require('./utils/boot/configure-logger.js');
require('./utils/boot/configure-unhandled-rejections.js');


// Load the UI
require('./utils/boot/configure-browser-window.js');

const app = require('ampersand-app');
const configureCore = require('./utils/boot/configure-core.js');
const configureServices = require('./utils/boot/configure-services.js');
const upsertCoinstacUserDir = require('./utils/boot/upsert-coinstac-user-dir.js');
const loadConfig = require('./utils/boot/load-config.js');

// Boot up the main process
loadConfig()
.then(configureCore)
.then(configureLogger)
.then(upsertCoinstacUserDir)
.then(configureServices)
.then(() => {
  app.logger.verbose('main process booted');

  ipcPromise.on('download-comps', (params) => {
    console.log(app.core);
    return app.core.computationRegistryNew
      .pullPipelineComputations({ comps: params })
      .then((pullStreams) => {
        pullStreams.on('data', (data) => {
          let output = compact(data.toString().split('\r\n'));
          output = output.map(JSON.parse);
          app.mainWindow.webContents.send('docker-out', output);
        });

        pullStreams.on('close', (code) => {
          return code;
        });

        pullStreams.on('error', (err) => {
          return err;
        });
      });
  });
});
