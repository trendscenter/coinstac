'use strict';

const logUnhandledError = require('../../../common/utils/log-unhandled-error.js');

// Setup process listeners to handle uncaught exceptions
process.on('uncaughtException', logUnhandledError());
