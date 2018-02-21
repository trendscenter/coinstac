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
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import CollectionPipeline from './collection-pipeline';

class CollectionConsortia extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeConsortium: { stepIO: [], runs: 0, pipelineSteps: [] },
    };

    this.setActivePipeline = this.setActivePipeline.bind(this);
    this.setPipelineSteps = this.setPipelineSteps.bind(this);
    this.updateConsortiumClientProps = this.updateConsortiumClientProps.bind(this);
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
    // Prepopulate stepIO with same number of steps as pipeline to ensure indices match
    // TODO: Add section specifically for covars and prepopulate empty values for all params?
    const stepIO = Array(steps.length)
      .fill([]);

    steps.forEach((step, index) => {
      if ('covariates' in step) {
        stepIO[index] = {
          covariates: Array(steps.covariates.length).fill([]),
        };
      }

      if ('data' in step) {
        stepIO[index] = {
          ...stepIO[index],
          data: Array(steps.data.length).fill([]),
        };
      }
    });

    this.setState(prevState => ({
      activeConsortium: {
        ...prevState.activeConsortium,
        pipelineSteps: steps,
        stepIO,
      },
    }));
  }

  updateConsortiumClientProps(pipelineStepIndex, prop, propIndex, propArray) {
    const { updateAssociatedConsortia } = this.props;

    this.setState(prevState => ({
      activeConsortium: {
        ...prevState.activeConsortium,
        stepIO: update(prevState.activeConsortium.stepIO, {
          $splice: [[
            pipelineStepIndex,
            1,
            { ...prevState.activeConsortium.stepIO[pipelineStepIndex], [prop]: [...propArray] }]],
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
              if (cons.activePipelineId &&
                  (cons.members.indexOf(user.id) > -1 || cons.owners.indexOf(user.id) > -1) &&
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
              updateConsortiumClientProps={this.updateConsortiumClientProps}
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

function mapStateToProps({ auth }) {
  return { auth };
}

export default connect(mapStateToProps)(CollectionConsortia);
