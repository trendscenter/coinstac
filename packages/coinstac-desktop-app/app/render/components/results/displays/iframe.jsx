import React from 'react';
import { connect } from 'react-redux';
import path from 'path';
import PropTypes from 'prop-types';

const Iframe = ({
  appDirectory, run, value, user,
}) => {
  const iFrameHeight = '600px';

  if (typeof value === 'string') {
    return (
      <div>
        <div>
          <iframe
            style={{ width: '100%', height: iFrameHeight, border: 0 }}
            src={path.join(appDirectory, 'output', user.id, run.id, value)}
            title="iframe"
            width="100%"
            height={iFrameHeight}
          />
        </div>
      </div>
    );
  }

  if (typeof value === 'object') {
    const result = value.map(v => (
      <div key={v.path}>
        <div>
          <h2>{v.title}</h2>
          <iframe
            style={{ width: '100%', height: iFrameHeight, border: 0 }}
            src={path.join(appDirectory, 'output', user.id, run.id, v.path)}
            title="iframe"
            width="100%"
            height={iFrameHeight}
          />
        </div>
      </div>
    ));
    return result;
  }

  return null;
};

Iframe.propTypes = {
  appDirectory: PropTypes.string.isRequired,
  run: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
  user: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
});

export default connect(mapStateToProps)(Iframe);
