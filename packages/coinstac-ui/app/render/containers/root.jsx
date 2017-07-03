import React from 'react';
import { Provider } from 'react-redux';
import { Router, hashHistory } from 'react-router';

import configureStore from '../state/store';
import routes from '../routes';

const store = configureStore();

const Root = () => (
  <Provider store={store}>
    <Router history={hashHistory} routes={routes} />
  </Provider>
);

export default Root;
