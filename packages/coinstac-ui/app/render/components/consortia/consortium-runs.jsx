import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import RunsList from '../common/runs-list';

const ConsortiumRuns = ({ runs, consortia }) => (
  <RunsList
    consortia={consortia}
    hoursSinceActive={0}
    limitToComplete={false}
    runs={runs}
  />
);

ConsortiumRuns.propTypes = {
  consortia: PropTypes.array,
  runs: PropTypes.array,
};

ConsortiumRuns.defaultProps = {
  consortia: null,
  runs: null,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default connect(mapStateToProps)(ConsortiumRuns);
