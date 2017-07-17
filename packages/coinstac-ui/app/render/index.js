require('babel-polyfill');

// Set up root paths
require('../common/utils/add-root-require-path.js');

import app from 'ampersand-app';
import React from 'react';
import { render } from 'react-dom';
import { hashHistory } from 'react-router';

import { start as startErrorHandling } from './utils/boot/configure-error-handling.js';
import configureLogger from './utils/boot/configure-logger.js';
import configureMainServices from './utils/configure-main-services.js';
import { configure as configureStore } from './state/store.js';

import Root from './containers/root';

// Boot up the render process
configureLogger();
startErrorHandling();
configureMainServices();

window.app = app;
app.isDev = process.env.NODE_ENV === 'development';
app.analysisRequestId = app.analysisRequestId || 0;

// load application stylesheets
require('./styles/app.scss');

const rootEl = document.getElementById('app');
const store = configureStore();

render(
  <Root history={hashHistory} store={store} />,
  rootEl
);

app.renderLogger.info('renderer process up');

if (module.hot) {
  module.hot.accept('./containers/root', () => {
    /* eslint-disable global-require */
    const NextRoot = require('./containers/root').default;
    /* eslint-enable global-require */
    render(
      <NextRoot history={hashHistory} store={store} />,
      rootEl
    );
  });
}
