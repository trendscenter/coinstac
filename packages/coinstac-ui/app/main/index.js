/**
 * Main process entry point.
 *
 * This script runs boot scripts in order, wiring up Electron's main process and
 * kicking off the render process (UI).
 */

'use strict';

// Prep packages for electron
require('require-rebuild')();

// if no env set prd
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Set up root paths
require('../common/utils/add-root-require-path.js');

// Parse and handle CLI flags
const parseCLIInput = require('app/main/utils/boot/parse-cli-input.js');
parseCLIInput();

// Add dev mode specific services
require('app/main/utils/boot/configure-dev-services.js');

// Set up logging
const configureLogger = require('app/main/utils/boot/configure-logger.js');

// Set up error handling
require('app/main/utils/boot/configure-uncaught-exceptions.js');
require('app/main/utils/boot/configure-unhandled-rejections.js');

// Load the UI
require('app/main/utils/boot/configure-browser-window.js');

const app = require('ampersand-app');
const configureCore = require('app/main/utils/boot/configure-core.js');
const configureServices = require('app/main/utils/boot/configure-services.js');
const groundControl = require('app/main/utils/boot/ground-control.js');
const upsertCoinstacUserDir = require('app/main/utils/boot/upsert-coinstac-user-dir.js');
const loadConfig = require('app/main/utils/boot/load-config.js');

/**
 * @todo Move all CLI flag handling to this block or another appropriate file.
 * @todo Make hotswap module statically `require`-able
 */
function configureMainHotSwap() {
  if (process.env.NODE_ENV === 'development') {
    const cliOptions = parseCLIInput.get();

    if (cliOptions.hotswap) {
      require('app/main/utils/boot/configure-main-hotswap.js');
    }
  }
}

// Boot up the main process
loadConfig()
.then(configureCore)
.then(configureLogger)
.then(configureMainHotSwap)
.then(upsertCoinstacUserDir)
.then(configureServices)
.then(groundControl)
.then(() => {
  app.logger.verbose('main process booted');
});
