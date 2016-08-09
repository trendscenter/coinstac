'use strict';

const app = require('ampersand-app');
const files = require('../../services/files.js');
const set = require('lodash/set');

module.exports = function configureServices() {
  set(app, 'main.services.files', files);
};
