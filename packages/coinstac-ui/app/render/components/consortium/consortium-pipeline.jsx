import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Col, DropdownButton, MenuItem, Row, Well } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { graphql } from 'react-apollo';
import ApolloClient from '../../state/apollo-client';
import { fetchAllConsortiaFunc, saveConsortiumFunc } from '../../state/graphql-queries';

const styles = {
  activePipelineButton: { margin: '0 5px 0 0' },
  activePipelineParagraph: { borderBottom: '1px solid black' },
  textCenter: { textAlign: 'center' },
};

const ConsortiumPipeline = (
  {
    addComputation,
    controller,
    moveComputation,
  }
) =>
  (
    <div>
      <h3>Active Pipeline</h3>
      <Well><em>No active pipeline</em></Well>
      <div className="clearfix">
        <div className="pull-right">
          <Button
            bsStyle="info"
            style={styles.activePipelineButton}
          >
            Edit
          </Button>
          <Button
            bsStyle="success"
            style={styles.activePipelineButton}
          >
            Save
          </Button>
        </div>
      </div>
      <h4 style={styles.activePipelineParagraph}>Activate a pipeline from...</h4>
      <Row>
        <Col xs={6} style={styles.textCenter}>
          <DropdownButton id="your-pipelines-dropdown" title={'Your Pipelines'} bsStyle="primary">
            <MenuItem>Stuff</MenuItem>
            <MenuItem>Things</MenuItem>
          </DropdownButton>
        </Col>
        <Col xs={6} style={styles.textCenter}>
          <DropdownButton id="shared-pipelines-dropdown" title={'Shared Pipelines'} bsStyle="primary">
            <MenuItem>Stuff</MenuItem>
            <MenuItem>Things</MenuItem>
          </DropdownButton>
        </Col>
      </Row>
      <Row style={{ marginTop: 50 }}>
        <Col xs={12} style={styles.textCenter}>
          <p><em>Or create a new pipeline</em></p>
          <LinkContainer to="/pipelines/new">
            <Button bsStyle="success">
              <span aria-hidden="true" className="glphicon glyphicon-plus" />
              {' '}
              New Pipeline
            </Button>
          </LinkContainer>
        </Col>
      </Row>
    </div>
  );

/*
const ConsortiumPipelineWithData = graphql(saveConsortiumFunc, {
  props: ({ mutate }) => ({
    saveConsortium: consortium => mutate({
      variables: { consortium },
      update: (store, { data: { saveConsortium } }) => {
        const data = store.readQuery({ query: fetchAllConsortiaFunc });
        const index = data.fetchAllConsortia.findIndex(cons => cons.id === saveConsortium.id);
        if (index > -1) {
          data.fetchAllConsortia[index] = { ...saveConsortium };
        } else {
          data.fetchAllConsortia.push(saveConsortium);
        }
        store.writeQuery({ query: fetchAllConsortiaFunc, data });
      },
    }),
  }),
})(ConsortiumPipeline);
*/

export default ConsortiumPipeline;
