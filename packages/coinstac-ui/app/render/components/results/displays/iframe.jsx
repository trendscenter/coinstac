import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const Iframe = ({ path }) => {
  const iFrameHeight = '600px';
  return (
    <div>
      <div>
        <iframe
          style={{ width: '100%', height: iFrameHeight }}
          src={path}
          title="iframe"
          width="100%"
          height={iFrameHeight}
          frameBorder="0"
        />
      </div>
    </div>
  );
};

Iframe.propTypes = {
  path: PropTypes.string.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
});

export default connect(mapStateToProps)(Iframe);
