import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  DropdownButton,
  Form,
  MenuItem,
  Panel,
  Button,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_CONSORTIA_QUERY,
} from '../../state/graphql/functions';
import { getAllAndSubProp } from '../../state/graphql/props';
import CollectionPipeline from './collection-pipeline';

class CollectionConsortia extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeConsortium: { stepIO: [], runs: 0, pipelineSteps: [] },
    };

    this.setActivePipeline = this.setActivePipeline.bind(this);
    this.setPipelineSteps = this.setPipelineSteps.bind(this);
    this.updateConsortiumCovars = this.updateConsortiumCovars.bind(this);
  }

  setActivePipeline(consId) {
    let consortium = {};
    const consIndex = this.props.associatedConsortia
      .findIndex(cons => cons.id === consId);

    if (consIndex === -1) {
      consortium = {
        ...this.props.consortia.find(c => consId === c.id),
        stepIO: [],
        runs: 0,
        pipelineSteps: [],
      };
    } else {
      consortium = { ...this.props.associatedConsortia[consIndex] };
    }

    this.setState({
      activeConsortium: {
        ...consortium,
        stepIO: [...consortium.stepIO],
      },
    });
  }

  setPipelineSteps(steps) {
    this.setState(prevState => ({
      activeConsortium: {
        ...prevState.activeConsortium,
        pipelineSteps: steps,
      },
    }));
  }

  updateConsortiumCovars(pipelineStepIndex, covariateIndex, covarArray) {
    const { updateAssociatedConsortia } = this.props;

    this.setState(prevState => ({
      activeConsortium: {
        ...prevState.activeConsortium,
        stepIO: update(prevState.activeConsortium.stepIO, {
          $splice: [[pipelineStepIndex, 1, [...covarArray]]],
        }),
      },
    }), (() => {
      updateAssociatedConsortia(this.state.activeConsortium);
    }));
  }

  render() {
    const {
      associatedConsortia,
      auth: { user },
      consortia,
      collection,
      saveCollection,
    } = this.props;

    return (
      <div>
        <Form onSubmit={saveCollection}>
          {consortia.length > 0 &&
            associatedConsortia.length > 0 &&
            <h3>Associated Consortia</h3>
          }
          {consortia.length && consortia.map((cons) => {
            const associatedIndex = associatedConsortia.findIndex(c => c.id === cons.id);
            if (associatedIndex > -1) {
              return (
                <Panel key={`${cons.id}-list-item`}>
                  <h4>{cons.name}</h4>
                  <p>Runs: {associatedConsortia[associatedIndex].runs}</p>
                  <LinkContainer className="pull-right" to={`/dashboard/consortia/${cons.id}`}>
                    <Button
                      bsStyle="info"
                      type="submit"
                      className="pull-right"
                    >
                      View Consortium
                    </Button>
                  </LinkContainer>
                  <Button
                    bsStyle="primary"
                    type="submit"
                    onClick={() => this.setActivePipeline(cons.id)}
                  >
                    View File Mappings
                  </Button>
                </Panel>
              );
            }
            return null;
          })}
          {consortia.length && <h3>Add to Consortia</h3>}
          <DropdownButton
            bsStyle="info"
            id="member-consortia-dropdown"
            title="Select Consortia"
          >
            {consortia.map((cons) => {
              if ((cons.members.indexOf(user.id) > -1 || cons.owners.indexOf(user.id) > -1) &&
                  associatedConsortia.findIndex(c => c.id === cons.id) === -1) {
                return (
                  <MenuItem
                    eventKey={cons.id}
                    key={`${cons.id}-menuitem`}
                    onSelect={this.setActivePipeline}
                  >
                    {cons.name}
                  </MenuItem>
                );
              }
              return null;
            })}
            {(!user.permissions.consortia ||
              user.permissions.consortia.length === 0) &&
              <MenuItem
                eventKey={'no-cons-menuitem'}
                key={'no-cons-menuitem'}
              >
                <em>No member and/or owned consortia</em>
              </MenuItem>
            }
          </DropdownButton>
          {this.state.activeConsortium.name &&
            <CollectionPipeline
              key={`${this.state.activeConsortium.id}-pipeline`}
              associatedConsortia={associatedConsortia}
              collection={collection}
              consortiumName={this.state.activeConsortium.name}
              consortiumId={this.state.activeConsortium.id}
              pipelineId={this.state.activeConsortium.activePipelineId}
              pipelineSteps={this.state.activeConsortium.pipelineSteps}
              setPipelineSteps={this.setPipelineSteps}
              updateConsortiumCovars={this.updateConsortiumCovars}
            />
          }
          <Button
            bsStyle="success"
            type="submit"
            className="pull-right"
          >
            Save
          </Button>
        </Form>
      </div>
    );
  }
}

CollectionConsortia.propTypes = {
  auth: PropTypes.object.isRequired,
  associatedConsortia: PropTypes.array,
  collection: PropTypes.object,
  consortia: PropTypes.array,
  saveCollection: PropTypes.func.isRequired,
  updateAssociatedConsortia: PropTypes.func.isRequired,
};

CollectionConsortia.defaultProps = {
  associatedConsortia: [],
  collection: null,
  consortia: [],
};

const CollectionConsortiaWithData = graphql(FETCH_ALL_CONSORTIA_QUERY, getAllAndSubProp(
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  'consortia',
  'fetchAllConsortia',
  'subscribeToConsortia',
  'consortiumChanged'
))(CollectionConsortia);

function mapStateToProps({ auth }) {
  return { auth };
}

export default connect(mapStateToProps)(CollectionConsortiaWithData);
