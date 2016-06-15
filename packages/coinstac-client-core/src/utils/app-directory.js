/**
 * @module applicationDirectory
 * @type string
 * @description outputs the app directory for your OS
 */

'use strict';

const path = require('path');
const osHomedir = require('os-homedir');
const appDirectory = path.join(osHomedir(), '.coinstac');

module.exports = appDirectory;
