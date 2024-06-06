import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class RouteContainer extends Component { // eslint-disable-line
  render() {
    const {
      children, computations, consortia, pipelines, runs, containerStatus,
    } = this.props;
    const childrenWithProps = React.cloneElement(children, {
      computations,
      consortia,
      pipelines,
      runs,
      containerStatus,
    });

    return (
      <div>
        {childrenWithProps}
      </div>
    );
  }
}

RouteContainer.propTypes = {
  children: PropTypes.element,
  computations: PropTypes.array,
  consortia: PropTypes.array,
  pipelines: PropTypes.array,
  runs: PropTypes.array,
  containerStatus: PropTypes.bool,
};

RouteContainer.defaultProps = {
  children: null,
  computations: [],
  consortia: [],
  pipelines: [],
  runs: [],
  containerStatus: false,
};
