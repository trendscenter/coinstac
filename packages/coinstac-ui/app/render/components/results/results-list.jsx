import React from 'react';
import { connect } from 'react-redux';
import TimeStamp from 'react-timestamp';
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
            <Panel key={run.id} header={<h3>{run.id}</h3>}>
              <p>Consortium id: {run.consortiumId}</p>
              {run.startDate &&
              <p>Started:
                <pre>
                  <TimeStamp
                    time={run.startDate / 1000}
                    precision={4}
                    autoUpdate={10}
                    format="ago"
                  />
                </pre>
              </p>}
              {run.endDate &&
              <p>Ended:
                <pre>
                  <TimeStamp
                    time={run.endDate / 1000}
                    precision={4}
                    autoUpdate={10}
                    format="ago"
                  />
                </pre>
              </p>}
              {run.clients &&
              <p>Clients: {run.clients}</p>
              }
              {run.pipelineSnapshot &&
              <p>Steps:
                <pre>{JSON.stringify(run.pipelineSnapshot.steps, null, ' ')}</pre>
              </p>}
              {run.pipelineSnapshot &&
              <LinkContainer
                to={`dashboard/pipelines/${run.pipelineSnapshot.id}`}
              >
                <Button bsStyle="info">View Pipeline</Button>
              </LinkContainer>
              }
              <LinkContainer
                className="pull-right"
                to={`dashboard/results/${run.id}`}
              >
                <Button bsStyle="success">View Results</Button>
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
