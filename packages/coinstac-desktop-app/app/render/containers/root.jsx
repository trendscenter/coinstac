import PropTypes from 'prop-types';
import React from 'react';
import { Router } from 'react-router';

import routes from '../routes';

const Root = ({ history }) => (
  <Router history={history} routes={routes} />
);

Root.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Root;
