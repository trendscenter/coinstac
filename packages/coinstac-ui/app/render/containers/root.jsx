import React from 'react';
import PropTypes from 'prop-types';
import { Router } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import client from '../state/apollo-client';
import routes from '../routes';

// TODO: Authenticate on existing JWT
console.log(`TODO: Use JWT to autologin: ${localStorage.getItem('id_token')}`);

const Root = ({ history, store }) => (
  <ApolloProvider store={store} client={client}>
    <Router history={history} routes={routes} />
  </ApolloProvider>
);

Root.propTypes = {
  history: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired,
};

export default Root;
