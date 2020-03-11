import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';

class Iframe extends Component {
  constructor(props) {
    super(props);

    this.state = {
      iFrameHeight: '600px',
    };
  }

  render() {
    const { path } = this.props;
    return (
      <div>
        <div>
          <iframe
            style={{width:'100%', height: this.state.iFrameHeight}}
            src={path}
            ref="iframe"
            width="100%"
            height={this.state.iFrameHeight}
            frameBorder="0"
          />
        </div>
      </div>
    );
  }
}

Iframe.propTypes = {
  path: PropTypes.string.isRequired,
};

const mapStateToProps = ({ auth: { user } }) => {
  return {
    user,
  };
};

export default connect(mapStateToProps)(Iframe);
