import './activity-indicator.css';

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

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
