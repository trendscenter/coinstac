import React from 'react';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import { Alert, Button, Panel } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import {
  FETCH_ALL_RESULTS_QUERY,
} from '../../state/graphql/functions';
import {
  resultsProp,
} from '../../state/graphql/props';

const ResultsList = ({ results }) =>
(
  <div>
    <div className="page-header clearfix">
      <h1 className="pull-left">Results</h1>
    </div>
    {results && results.map(result => (
      <Panel key={result.id} header={<h3>{result.title}</h3>}>
        <p>{result.date}</p>
        <p>{result.pipelineId}</p>
        <p>{result.results.type}</p>
        <LinkContainer
          to={`dashboard/results/${result.id}`}
        >
          <Button bsStyle="info">View Results</Button>
        </LinkContainer>
      </Panel>
    ))}
    {(!results || !results.length) &&
      <Alert bsStyle="info">
        No results found
      </Alert>
    }
  </div>
);

ResultsList.propTypes = {
  results: PropTypes.array,
};

ResultsList.defaultProps = {
  results: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

const ResultsListWithData = compose(
  graphql(FETCH_ALL_RESULTS_QUERY, resultsProp)
)(ResultsList);

export default connect(mapStateToProps)(ResultsListWithData);
