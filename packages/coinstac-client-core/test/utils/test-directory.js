'use strict';

const path = require('path');

/**
 * Test directory.
 * @module
 *
 * Common access point for the test directory. This should be used by all
 * things writing to disc during test runs.
 */
module.exports = path.resolve(__dirname, '..', '..', '.tmp');
