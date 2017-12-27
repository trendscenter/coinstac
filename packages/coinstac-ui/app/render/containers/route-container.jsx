import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RouteContainer extends Component { // eslint-disable-line
  render() {
    const { children, computations, consortia, pipelines } = this.props;
    const childrenWithProps = React.cloneElement(children, {
      computations,
      consortia,
      pipelines,
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
  computations: PropTypes.array.isRequired,
  consortia: PropTypes.array,
  pipelines: PropTypes.array.isRequired,
};

RouteContainer.defaultProps = {
  children: null,
  computations: [],
  consortia: [],
  pipelines: [],
};
