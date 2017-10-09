import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RouteContainer extends Component { // eslint-disable-line
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

RouteContainer.propTypes = {
  children: PropTypes.element,
};

RouteContainer.defaultProps = {
  children: null,
};
