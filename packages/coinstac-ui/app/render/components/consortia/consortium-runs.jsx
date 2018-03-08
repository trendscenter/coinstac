import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import RunsList from '../common/runs-list';

const ConsortiumRuns = ({ runs, consortia }) =>
  (
    <RunsList
      consortia={consortia}
      hoursSinceActive={0}
      limitToComplete={false}
      runs={runs}
    />
  );

ConsortiumRuns.propTypes = {
  runs: PropTypes.array,
  consortia: PropTypes.array,
};

ConsortiumRuns.defaultProps = {
  runs: null,
  consortia: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(ConsortiumRuns);
