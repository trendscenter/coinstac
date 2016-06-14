'use strict';

const electron = require('electron');

module.exports = function configureMainService() {
  const app = require('ampersand-app');
  const mApp = electron.remote.require('app/main/utils/expose-app.js')();
  app.core = mApp.core;
  app.main = mApp.main;
  app.config = mApp.config;
};
