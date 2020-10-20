/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { render } from 'react-dom';
import { hashHistory } from 'react-router';
import { ipcRenderer, remote } from 'electron';
import { ApolloProvider } from 'react-apollo';
import { syncHistoryWithStore } from 'react-router-redux';
import getApolloClient from './state/apollo-client';
import configureStore from './state/store';
import { start as startErrorHandling } from './utils/boot/configure-error-handling';

import Root from './containers/root';

// Set up root paths
require('../common/utils/add-root-require-path.js');

// Boot up the render process
startErrorHandling();

// load application stylesheets
require('./styles/app.scss');

const rootEl = document.getElementById('app');
global.config = remote.getGlobal('config');

if (process.env.CI) {
  global.console.warn = () => {};
}

const client = getApolloClient(global.config);
const store = configureStore(client);

const history = syncHistoryWithStore(hashHistory, store);

render(
  <ApolloProvider store={store} client={client}>
    <Root history={history} />
  </ApolloProvider>,
  rootEl
);

ipcRenderer.send('write-log', { type: 'info', message: 'renderer process up' });

if (module.hot) {
  module.hot.accept('./containers/root', () => {
    /* eslint-disable global-require */
    const NextRoot = require('./containers/root').default;
    /* eslint-enable global-require */
    render(
      <ApolloProvider store={store} client={client}>
        <NextRoot history={history} store={store} />
      </ApolloProvider>,
      rootEl
    );
  });
}
