import React, { Component } from 'react';
import PropTypes from 'prop-types';

const commonStyle = {
  marginRight: 15,
  fontSize: 25,
};

export default class StatusButtonWrapper extends Component {
  renderStatus = () => {
    const { status } = this.props;

    const pendingStyle = {
      ...commonStyle,
      fontSize: 20,
      color: '#3F6D87',
    };

    const successStyle = {
      ...commonStyle,
      color: '#2EB150',
    };

    const failStyle = {
      ...commonStyle,
      color: '#FFCC00',
    };

    switch (status) {
      case 'pending':
        return <i className="fa fa-circle-notch fa-spin" style={pendingStyle} />;
      case 'success':
        return <i className="animated bounceIn fa fa-check-circle" style={successStyle} />;
      case 'fail':
        return <i className="animated bounceIn fa fa-exclamation-circle" style={failStyle} />;
      default:
        return null;
    }
  }

  render() {
    const { children } = this.props;

    const wrapperStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
    };

    return (
      <div style={wrapperStyle}>
        {this.renderStatus()}
        {children}
      </div>
    );
  }
}

StatusButtonWrapper.propTypes = {
  children: PropTypes.node,
  status: PropTypes.oneOf(['init', 'pending', 'success', 'fail']),
};

StatusButtonWrapper.defaultProps = {
  children: null,
  status: 'init',
};
