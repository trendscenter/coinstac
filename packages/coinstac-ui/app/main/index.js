/**
 * Main process entry point.
 *
 * This script runs boot scripts in order, wiring up Electron's main process and
 * kicking off the render process (UI).
 */

'use strict';

// if no env set prd
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Set up root paths
require('../common/utils/add-root-require-path.js');

// Parse and handle CLI flags
const parseCLIInput = require('./utils/boot/parse-cli-input.js');
parseCLIInput();

// Add dev mode specific services
require('./utils/boot/configure-dev-services.js');

// Set up logging
const configureLogger = require('./utils/boot/configure-logger.js');

// Set up error handling
require('./utils/boot/configure-uncaught-exceptions.js');
require('./utils/boot/configure-unhandled-rejections.js');

// Load the UI
require('./utils/boot/configure-browser-window.js');

const app = require('ampersand-app');
const configureCore = require('./utils/boot/configure-core.js');
const configureServices = require('./utils/boot/configure-services.js');
const groundControl = require('./utils/boot/ground-control.js');
const upsertCoinstacUserDir = require('./utils/boot/upsert-coinstac-user-dir.js');
const loadConfig = require('./utils/boot/load-config.js');

/**
 * @todo Move all CLI flag handling to this block or another appropriate file.
 * @todo Make hotswap module statically `require`-able
 */
function configureMainHotSwap() {
  if (process.env.NODE_ENV === 'development') {
    const cliOptions = parseCLIInput.get();

    if (cliOptions.hotswap) {
      /* eslint-disable global-require */
      require('./utils/boot/configure-main-hotswap.js');
      /* eslint-enable global-require */
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
