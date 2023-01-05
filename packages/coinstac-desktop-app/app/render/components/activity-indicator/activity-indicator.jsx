import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './activity-indicator.css';

const ActivityIndicator = ({ visible }) => (
  <ul
    className={classNames('activity-indicator', {
      'is-loading': visible,
    })}
  >
    <li />
    <li />
    <li />
    <li />
  </ul>
);

ActivityIndicator.defaultProps = {
  visible: false,
};

ActivityIndicator.propTypes = {
  visible: PropTypes.bool,
};

export default ActivityIndicator;
