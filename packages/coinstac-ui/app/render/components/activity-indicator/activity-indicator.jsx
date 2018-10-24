import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './activity-indicator.css';

export default class ActivityIndicator extends React.Component {
  static defaultProps = {
    visible: false
  };

  static propTypes = {
    visible: PropTypes.bool
  };

  render() {
    return (
      <ul
        className={classNames('activity-indicator', {
          'is-loading': this.props.visible
        })}
      >
        <li />
        <li />
        <li />
        <li />
      </ul>
    )
  }
}