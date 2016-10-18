'use strict';

const app = require('ampersand-app');
const clean = require('../../services/clean.js');
const files = require('../../services/files.js');
const { set } = require('lodash');

module.exports = function configureServices() {
  set(app, 'main.services.clean', clean);
  set(app, 'main.services.files', files);
};
