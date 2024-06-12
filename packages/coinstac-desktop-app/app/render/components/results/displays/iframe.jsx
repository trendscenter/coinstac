import path from 'path';
import React from 'react';
import { useSelector } from 'react-redux';

const Iframe = ({ appDirectory, run, value }) => {
  const user = useSelector(state => state.auth.user);

  const iFrameHeight = '800px';
  let url = '';
  if (typeof value === 'undefined') {
    url = path.join(appDirectory, 'output', user.id, run.id, 'index.html');
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
  if (typeof value === 'string') {
    url = path.join(appDirectory, 'output', user.id, run.id, value);
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
    const result = value.map((v) => {
      url = path.join(appDirectory, 'output', user.id, run.id, v.path);
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

export default Iframe;
