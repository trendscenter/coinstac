/* eslint-disable react/jsx-filename-extension */
import app from 'ampersand-app';
import React from 'react';
import { render } from 'react-dom';

import { start as startErrorHandling } from './utils/boot/configure-error-handling';
import configureLogger from './utils/boot/configure-logger';
import configureMainServices from './utils/configure-main-services';

import Root from './containers/root';

require('babel-polyfill');

// Set up root paths
require('../common/utils/add-root-require-path.js');

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

render(
  <Root />,
  rootEl
);

app.logger.info('renderer process up');

if (module.hot) {
  module.hot.accept('./containers/root', () => {
    /* eslint-disable global-require */
    const NextRoot = require('./containers/root').default;
    /* eslint-enable global-require */
    render(
      <NextRoot />,
      rootEl
    );
  });
}
