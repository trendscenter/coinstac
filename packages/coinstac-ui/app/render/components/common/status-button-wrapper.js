import React, { Component } from 'react'
import PropTypes from 'prop-types'

const commonStyle = {
  marginRight: 15,
  fontSize: 25,
}

export default class StatusButtonWrapper extends Component {
  get pendignIcon() {
    const style = {
      ...commonStyle,
      fontSize: 20,
      color: '#3F6D87',
    }

    return <i className="fa fa-circle-notch fa-spin" style={style} />
  }

  get successIcon() {
    const style = {
      ...commonStyle,
      color: '#2EB150',
    }

    return <i className="animated bounceIn fa fa-check-circle" style={style} />
  }

  get failIcon() {
    const style = {
      ...commonStyle,
      color: '#FFCC00',
    }

    return <i className="animated bounceIn fa fa-exclamation-circle" style={style} />
  }

  renderStatus = () => {
    const { status } = this.props

    switch(status) {
      case 'pending':
        return this.pendignIcon
      case 'success':
        return this.successIcon
      case 'fail':
        return this.failIcon
      default:
        return null
    }
  }

  render() {
    const { children, status, ...otherProps } = this.props

    const wrapperStyle = {
      display: 'flex',
      alignItems: 'center',
    }

    return (
      <div style={wrapperStyle}>
        {this.renderStatus()}
        {children}
      </div>
    )
  }
}

StatusButtonWrapper.propTypes = {
  children: PropTypes.node,
  status: PropTypes.oneOf(['init', 'pending', 'success', 'fail']),
}

StatusButtonWrapper.defaultProps = {
  status: 'init',
}
