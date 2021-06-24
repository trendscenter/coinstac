import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RouteContainer extends Component { // eslint-disable-line
  render() {
    const {
      children, computations, consortia, pipelines, runs, dockerStatus,
    } = this.props;
    const childrenWithProps = React.cloneElement(children, {
      computations,
      consortia,
      pipelines,
      runs,
      dockerStatus,
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
  dockerStatus: PropTypes.bool.isRequired,
};

RouteContainer.defaultProps = {
  children: null,
  computations: [],
  consortia: [],
  pipelines: [],
  runs: [],
};
