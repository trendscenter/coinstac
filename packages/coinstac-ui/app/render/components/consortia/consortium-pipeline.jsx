import React, { Component } from 'react';
import { Button, Col, DropdownButton, MenuItem, Row, Well } from 'react-bootstrap';
import { Link } from 'react-router';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import {
  FETCH_ALL_CONSORTIA_QUERY,
  SAVE_ACTIVE_PIPELINE_MUTATION,
} from '../../state/graphql/functions';

const styles = {
  activePipelineButton: { margin: '0 5px 0 0' },
  activePipelineParagraph: { borderBottom: '1px solid black' },
  textCenter: { textAlign: 'center' },
};

class ConsortiumPipeline extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activePipeline: {},
      ownedPipelines: [],
      sharedPipelines: [],
      prevPipelines: []
    };

    this.removeCollectionsFromAssociatedConsortia =
      this.removeCollectionsFromAssociatedConsortia.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    const derivedState = {}

    if (props.pipelines.length > 0 &&
      props.consortium.activePipelineId &&
      (!state.activePipeline || state.activePipeline.id !== props.consortium.activePipelineId)
    ) {
      const activePipeline = props.pipelines
        .find(cons => cons.id === props.consortium.activePipelineId);
      derivedState.activePipeline = activePipeline;
    }

    if (props.pipelines !== state.prevPipelines) {
      let ownedPipelines = [];
      let sharedPipelines = [];

      ownedPipelines = props.pipelines.filter(
        pipe => pipe.owningConsortium === props.consortium.id
      );

      sharedPipelines = props.pipelines.filter(
        pipe => pipe.shared && pipe.owningConsortium !== props.consortium.id
      );

      derivedState.prevPipelines = props.pipelines;
      derivedState.ownedPipelines = ownedPipelines;
      derivedState.sharedPipelines = sharedPipelines;
    }

    return Object.keys(derivedState).length > 0 ? derivedState : null;
  }

  removeCollectionsFromAssociatedConsortia(consortiumId, value) {
    this.props.saveActivePipeline(consortiumId, value);
  }

  render() {
    const { consortium, owner } = this.props;
    const { activePipeline, ownedPipelines, sharedPipelines } = this.state;

    return (
      <div>
        <h3>Active Pipeline</h3>
        <Well>
          {activePipeline.id &&
            <div>
              <Link
                to={`/dashboard/pipelines/${consortium.activePipelineId}`}
              >
                <h4>{activePipeline.name}</h4>
              </Link>
              {activePipeline.description}
            </div>
          }
          {!activePipeline.id &&
            <em>No active pipeline</em>
          }
        </Well>
        {owner &&
          <div>
            <h4 style={styles.activePipelineParagraph}>Activate a pipeline from...</h4>
            <Row>
              <Col xs={6} style={styles.textCenter}>
                <DropdownButton
                  id="owned-pipelines-dropdown"
                  title={'Owned Pipelines'}
                  bsStyle="primary"
                  onSelect={value =>
                    this.removeCollectionsFromAssociatedConsortia(consortium.id, value)}
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
                  title={'Pipelines Shared With Me'}
                  bsStyle="primary"
                  onSelect={value =>
                    this.removeCollectionsFromAssociatedConsortia(consortium.id, value)}
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
                <Link
                  to={`/dashboard/pipelines/new/${consortium.id}`}
                >
                  <Button bsStyle="success">
                    <span aria-hidden="true" className="glphicon glyphicon-plus" />
                    {' '}
                    New Pipeline
                  </Button>
                </Link>
              </Col>
            </Row>
          </div>
        }
      </div>
    );
  }
}

ConsortiumPipeline.propTypes = {
  consortium: PropTypes.object.isRequired,
  owner: PropTypes.bool.isRequired,
  pipelines: PropTypes.array.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
};

// TODO: Move this to shared props?
const ConsortiumPipelineWithData = graphql(SAVE_ACTIVE_PIPELINE_MUTATION, {
  props: ({ mutate }) => ({
    saveActivePipeline: (consortiumId, activePipelineId) => mutate({
      variables: { consortiumId, activePipelineId },
      update: (store) => {
        const data = store.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
        const index = data.fetchAllConsortia.findIndex(con => con.id === consortiumId);
        if (index > -1) {
          data.fetchAllConsortia[index].activePipelineId = activePipelineId;
        }
        store.writeQuery({ query: FETCH_ALL_CONSORTIA_QUERY, data });
      },
    }),
  }),
})(ConsortiumPipeline);

export default ConsortiumPipelineWithData;
