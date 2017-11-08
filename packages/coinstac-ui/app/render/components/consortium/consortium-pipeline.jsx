import React, { Component } from 'react';
import { Button, Col, DropdownButton, MenuItem, Nav, NavItem, Row, Well } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { graphql } from 'react-apollo';
import ApolloClient from '../../state/apollo-client';
import PropTypes from 'prop-types';
import { fetchAllConsortiaFunc, fetchAllPipelinesFunc, saveActivePipelineFunc } from '../../state/graphql/functions';

const styles = {
  activePipelineButton: { margin: '0 5px 0 0' },
  activePipelineParagraph: { borderBottom: '1px solid black' },
  textCenter: { textAlign: 'center' },
};

class ConsortiumPipeline extends Component{
  constructor(props) {
    super(props);

    let ownedPipelines = null;
    let sharedPipelines = null;
    let activePipelineRef = {};

    const data = ApolloClient.readQuery({ query: fetchAllPipelinesFunc });
    ownedPipelines = data.fetchAllPipelines.filter(pipe => pipe.owningConsortium === props.consortium.id);
    sharedPipelines = data.fetchAllPipelines.filter(pipe => pipe.shared);

    if(this.props.consortium.activePipeline.length){
      activePipelineRef = data.fetchAllPipelines.find(pipe => pipe.id === this.props.consortium.activePipeline);
    }

    this.state = {
      ownedPipelines: ownedPipelines,
      sharedPipelines: sharedPipelines,
      activePipeline: this.props.consortium.activePipeline,
      activePipelineRef: activePipelineRef,
    }

    this.updateActivePipeline = this.updateActivePipeline.bind(this);
  }

  updateActivePipeline(evt){
    const data = ApolloClient.readQuery({ query: fetchAllPipelinesFunc });
    let activePipelineRef = data.fetchAllPipelines.find(pipe => pipe.id === evt.value);

    this.setState(prevState => ({
      ownedPipelines: prevState.ownedPipelines,
      sharedPipelines: prevState.sharedPipelines,
      activePipeline: evt.value,
      activePipelineRef: activePipelineRef,
    }));

    this.props.saveActivePipeline(this.props.consortium.id, evt.value);
  }

  render(){
    let { consortium } = this.props;
    let { ownedPipelines, sharedPipelines } = this.state;
    return(
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
          <DropdownButton id="owned-pipelines-dropdown" title={'Owned Pipelines'} bsStyle="primary"
            onSelect={(value, e) => this.updateActivePipeline({ value: value })}>
            {ownedPipelines.map(pipe => (
              <MenuItem 
                eventKey={pipe.id}
                key={pipe.id}
              >
                {pipe.name}
              </MenuItem>))}
          </DropdownButton>
        </Col>
        <Col xs={6} style={styles.textCenter}>
          <DropdownButton id="shared-pipelines-dropdown" title={'Shared Pipelines'} bsStyle="primary"
            onSelect={(value, e) => this.updateActivePipeline({ value: value })}>
            {sharedPipelines.map(pipe => (
              <MenuItem 
                eventKey={pipe.id}
                key={pipe.id}
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
  saveActivePipeline: PropTypes.func.isRequired,
};

const ConsortiumPipelineWithData = graphql(saveActivePipelineFunc, {
    props: ({ mutate }) => ({
      saveActivePipeline: (consortiumId, activePipeline) => mutate({
        variables: { consortiumId, activePipeline },
        update: (store, { data: { saveActivePipeline } }) => {
          const data = store.readQuery({ query: fetchAllConsortiaFunc });
          const index = data.fetchAllConsortia.findIndex(con => con.id === consortiumId);
          if (index > -1) {
            data.fetchAllConsortia[index].activePipeline = activePipeline;
          }
          store.writeQuery({ query: fetchAllConsortiaFunc, data });
        },
      }),
    }),
  })(ConsortiumPipeline);

export default ConsortiumPipelineWithData;
