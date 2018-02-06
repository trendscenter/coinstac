import React from 'react';
import { connect } from 'react-redux';
import { Alert, Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';

const ResultsList = ({ runs }) => {
  let runNoResultsCount = 0;

  return (
    <div>
      <div className="page-header clearfix">
        <h1 className="pull-left">Results</h1>
      </div>
      {runs && runs.map((run) => {
        if (run.results) {
          return (
            <Panel key={run.id} header={<h3>{run.title}</h3>}>
              <p>{run.date}</p>
              <p>{run.pipelineId}</p>
              <p>{run.results && run.results.type ? run.results.type : 'none'}</p>
              <LinkContainer
                to={`dashboard/results/${run.id}`}
              >
                <Button bsStyle="info">View Results</Button>
              </LinkContainer>
            </Panel>
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
};

ResultsList.defaultProps = {
  runs: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

export default connect(mapStateToProps)(ResultsList);
