import React from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Alert, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

const PipelinesList = ({ auth: { user }, pipelines }) => (
  <div>
    <div className="page-header clearfix">
      <h1 className="pull-left">Pipelines</h1>
      <LinkContainer className="pull-right" to="/dashboard/pipelines/new">
        <Button bsStyle="primary" className="pull-right">
          <span aria-hidden="true" className="glphicon glyphicon-plus" />
          {' '}
          Create Pipeline
        </Button>
      </LinkContainer>
    </div>
    {pipelines && pipelines.map(pipeline => (
      <div>
        {pipeline.name}
      </div>
    ))}
    {!pipelines &&
      <Alert bsStyle="info">
        No pipelines found
      </Alert>
    }
  </div>
);

PipelinesList.propTypes = {
  auth: PropTypes.object.isRequired,
  pipelines: PropTypes.array,
};

PipelinesList.defaultProps = {
  pipelines: null,
};

const mapStateToProps = ({ auth }) => {
  return { auth };
};

/*
const PipelinesListWithData = graphql(fetchAllConsortiaFunc, {
  props: ({ data: { fetchAllConsortia } }) => ({
    consortia: fetchAllConsortia,
  }),
})(PipelinesList);
*/

export default connect(mapStateToProps)(PipelinesList);
