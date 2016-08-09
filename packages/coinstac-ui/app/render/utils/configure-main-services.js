import electron from 'electron';

module.exports = function configureMainService() {
  const app = require('ampersand-app'); // eslint-disable-line global-require
  const mApp = electron.remote.require('app/main/utils/expose-app.js')();
  app.core = mApp.core;
  app.main = mApp.main;
  app.config = mApp.config;
};
