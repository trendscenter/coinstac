import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const styles = {
  outputBox: { marginTop: 10, height: 400, overflowY: 'scroll' },
  topMargin: { marginTop: 10 },
};

const DockerStatus = ({ dockerOut }) => (
  <div>
    <div className="page-header clearfix">
      <h1 className="pull-left">Docker Status</h1>
    </div>

    {dockerOut &&
      <pre style={styles.outputBox}>
        {dockerOut.map(elem => (
          <div
            key={elem.id && elem.id !== 'latest' ? elem.id : elem.status}
            style={elem.isErr ? { color: 'red' } : {}}
          >
            {elem.id ? `${elem.id}: ` : ''}{elem.status} {elem.progress}
          </div>
        ))}
      </pre>
    }
  </div>
);

DockerStatus.propTypes = {
  dockerOut: PropTypes.array.isRequired,
};

const mapStateToProps = ({ docker: { dockerOut } }) => {
  return { dockerOut };
};

export default connect(mapStateToProps)(DockerStatus);
