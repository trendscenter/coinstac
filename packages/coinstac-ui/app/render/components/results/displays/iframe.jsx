import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import path from 'path';

const Iframe = ({ appDirectory, run, value, user }) => {
  const iFrameHeight = '600px';
  if (typeof value === 'string') {
    let url = path.join(appDirectory, 'output', user.id, run.id, value);
    return (
      <div>
        <div>
          <iframe
            style={{ width: '100%', height: iFrameHeight }}
            src={url}
            title="iframe"
            width="100%"
            height={iFrameHeight}
            frameBorder="0"
          />
        </div>
      </div>
    );
  }
  if (typeof value === 'object') {
    let result = value.map((v) => {
      let url = path.join(appDirectory, 'output', user.id, run.id, v.path);
      return (
        <div>
          <div>
            <h2>{v.title}</h2>
            <iframe
              style={{ width: '100%', height: iFrameHeight }}
              src={url}
              title="iframe"
              width="100%"
              height={iFrameHeight}
              frameBorder="0"
            />
          </div>
        </div>
      );
    });
    return result;
  }
};

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
});

export default connect(mapStateToProps)(Iframe);
