import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import ResultItem from '../common/result-item';

const ResultsList = ({ runs, consortia }) => {
  let runNoResultsCount = 0;

  return (
    <div>
      <div className="page-header clearfix">
        <h1 className="pull-left">Results</h1>
      </div>
      {runs && runs.map((run) => {
        if (run.results) {
          return (
            <ResultItem
              key={`${run.id}-list-item`}
              runObject={run}
              consortia={consortia}
            />
          );
        }

        runNoResultsCount += 1;
        return null;
      })}
      {(!runs || !runs.length || runNoResultsCount === runs.length) &&
        <Alert bsStyle="info">
          No results found
        </Alert>
      }
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

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(ResultsList);
