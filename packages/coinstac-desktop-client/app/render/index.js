/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { render } from 'react-dom';
import { hashHistory } from 'react-router';
import { ipcRenderer } from 'electron';
import { Provider as ReduxProvider } from 'react-redux';
import { syncHistoryWithStore } from 'react-router-redux';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import configureStore from './state/store';
import { start as startErrorHandling } from './utils/boot/configure-error-handling';

import Root from './containers/root';

// Set up root paths
require('../common/utils/add-root-require-path');

// Boot up the render process
startErrorHandling();

// load application stylesheets
require('./styles/app.scss');

const rootEl = document.getElementById('app');

if (process.env.CI) {
  global.console.warn = () => {};
}

const store = configureStore();

const history = syncHistoryWithStore(hashHistory, store);

render(
  <ReduxProvider store={store}>
    <Root history={history} />
  </ReduxProvider>,
  rootEl
);

ipcRenderer.send('write-log', { type: 'info', message: 'renderer process up' });

if (module.hot) {
  module.hot.accept('./containers/root', () => {
    /* eslint-disable global-require */
    const NextRoot = require('./containers/root').default;
    /* eslint-enable global-require */
    render(
      <ReduxProvider store={store}>
        <NextRoot history={history} />
      </ReduxProvider>,
      rootEl
    );
  });
}
