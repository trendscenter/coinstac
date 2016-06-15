'use strict';

const logUnhandledError = require('app/common/utils/log-unhandled-error.js');

process.on('unhandledRejection', logUnhandledError());
