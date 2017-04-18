require('babel-polyfill');

// Set up root paths
require('../common/utils/add-root-require-path.js');

import app from 'ampersand-app';
import React from 'react';
import { render } from 'react-dom';
import { Router, hashHistory } from 'react-router';
import { Provider } from 'react-redux';

import { start as startErrorHandling } from './utils/boot/configure-error-handling.js';
import configureLogger from './utils/boot/configure-logger.js';
import configureMainServices from './utils/configure-main-services.js';
import { configure as configureStore } from './state/store.js';
import routes from './routes.js';


// load application stylesheets
require('./styles/app.scss');

const loadUI = function loadUI() {
  const store = configureStore();

  window.app = app;
  app.isDev = process.env.NODE_ENV === 'development';
  app.analysisRequestId = app.analysisRequestId || 0;

  render(
    <Provider store={store}>
      <Router history={hashHistory} routes={routes} />
    </Provider>,
    document.getElementById('app')
  );

  app.logger.info('renderer process up');
};


// Boot up the render process
Promise.resolve(configureLogger())
  .then(startErrorHandling)
  .then(configureMainServices)
  .then(loadUI);
