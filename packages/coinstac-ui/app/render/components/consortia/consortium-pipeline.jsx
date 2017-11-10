import React, { Component } from 'react';
import { Button, Col, DropdownButton, MenuItem, NavItem, Row, Well } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import ApolloClient from '../../state/apollo-client';
import { FETCH_ALL_CONSORTIA_QUERY, FETCH_ALL_PIPELINES_QUERY, SAVE_ACTIVE_PIPELINE_MUTATION } from '../../state/graphql/functions';

const styles = {
  activePipelineButton: { margin: '0 5px 0 0' },
  activePipelineParagraph: { borderBottom: '1px solid black' },
  textCenter: { textAlign: 'center' },
};

class ConsortiumPipeline extends Component {
  constructor(props) {
    super(props);

    let ownedPipelines = {};
    let sharedPipelines = {};
    let activePipelineRef = {};

    const data = ApolloClient.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
    ownedPipelines = data.fetchAllPipelines.filter(
      pipe => pipe.owningConsortium === props.consortium.id
    );

    sharedPipelines = data.fetchAllPipelines.filter(
      pipe => pipe.shared
    );

    if (this.props.consortium.activePipeline) {
      activePipelineRef = data.fetchAllPipelines.find(
        pipe => pipe.id === this.props.consortium.activePipeline
      );
    }

    this.state = {
      ownedPipelines: [...ownedPipelines],
      sharedPipelines: [...sharedPipelines],
      activePipelineRef: { ...activePipelineRef },
      activePipeline: this.props.consortium.activePipeline,
    };

    this.updateActivePipeline = this.updateActivePipeline.bind(this);
  }

  updateActivePipeline(val) {
    const data = ApolloClient.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
    const activePipelineRef = data.fetchAllPipelines.find(pipe => pipe.id === val);

    this.setState(prevState => ({
      ownedPipelines: prevState.ownedPipelines,
      sharedPipelines: prevState.sharedPipelines,
      activePipeline: val,
      activePipelineRef: { ...activePipelineRef },
    }));

    this.props.saveActivePipeline(this.props.consortium.id, val);
  }

  render() {
    const { consortium } = this.props;
    const { ownedPipelines, sharedPipelines } = this.state;
    return (
      <div>
        <h3>Active Pipeline</h3>
        <Well>
          {this.state.activePipeline &&
          <LinkContainer
            to={`/dashboard/pipelines/${this.state.activePipeline}`}
          >
            <NavItem>
              {this.state.activePipelineRef.name}
            </NavItem>
          </LinkContainer>}
        </Well>
        <h4 style={styles.activePipelineParagraph}>Activate a pipeline from...</h4>
        <Row>
          <Col xs={6} style={styles.textCenter}>
            <DropdownButton
              id="owned-pipelines-dropdown"
              title={'Owned Pipelines'}
              bsStyle="primary"
              onSelect={value => this.updateActivePipeline(value)}
            >
              {ownedPipelines.map(pipe => (
                <MenuItem
                  eventKey={pipe.id}
                  key={`owned-${pipe.id}`}
                >
                  {pipe.name}
                </MenuItem>))}
            </DropdownButton>
          </Col>
          <Col xs={6} style={styles.textCenter}>
            <DropdownButton
              id="shared-pipelines-dropdown"
              title={'Shared Pipelines'}
              bsStyle="primary"
              onSelect={value => this.updateActivePipeline(value)}
            >
              {sharedPipelines.map(pipe => (
                <MenuItem
                  eventKey={pipe.id}
                  key={`shared-${pipe.id}`}
                >
                  {pipe.name}
                </MenuItem>))}
            </DropdownButton>
          </Col>
        </Row>
        <Row style={{ marginTop: 50 }}>
          <Col xs={12} style={styles.textCenter}>
            <p><em>Or create a new pipeline</em></p>
            <LinkContainer
              to={`/dashboard/pipelines/new/${consortium.id}`}
            >
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
  }
}

ConsortiumPipeline.propTypes = {
  consortium: PropTypes.object.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
};

const ConsortiumPipelineWithData = graphql(SAVE_ACTIVE_PIPELINE_MUTATION, {
  props: ({ mutate }) => ({
    saveActivePipeline: (consortiumId, activePipeline) => mutate({
      variables: { consortiumId, activePipeline },
      update: (store) => {
        const data = store.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
        const index = data.fetchAllConsortia.findIndex(con => con.id === consortiumId);
        if (index > -1) {
          data.fetchAllConsortia[index].activePipeline = activePipeline;
        }
        store.writeQuery({ query: FETCH_ALL_CONSORTIA_QUERY, data });
      },
    }),
  }),
})(ConsortiumPipeline);

export default ConsortiumPipelineWithData;
