import React from 'react';
import PropTypes from 'prop-types';
import RunsList from '../common/runs-list';

const ResultsList = ({ runs, consortia }) => {
  return (
    <div>
      <div className="page-header clearfix">
        <h1 className="pull-left">Results</h1>
      </div>

      <RunsList
        consortia={consortia}
        hoursSinceActive={0}
        limitToComplete
        runs={runs}
      />
    </div>
  );
};

ResultsList.propTypes = {
  runs: PropTypes.array,
  consortia: PropTypes.array,
};

ResultsList.defaultProps = {
  runs: null,
  consortia: null,
};

export default ResultsList;
