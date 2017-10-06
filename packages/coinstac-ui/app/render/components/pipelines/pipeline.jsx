import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { DragDropContext, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import shortid from 'shortid';
import update from 'immutability-helper';
import {
  Accordion,
  Checkbox,
  Col,
  ControlLabel,
  DropdownButton,
  Form,
  FormControl,
  FormGroup,
  MenuItem,
  Row,
  Well,
} from 'react-bootstrap';
import ApolloClient from '../../state/apollo-client';
import PipelineStep from './pipeline-step';
import ItemTypes from './pipeline-item-types';
import { fetchAllConsortiaFunc, fetchAllComputationsFunc } from '../../state/graphql-queries';

const computationTarget = {
  drop() {
  },
};

const collect = (connect, monitor) => (
  {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
  }
);

class Pipeline extends Component {
  constructor(props) {
    super(props);

    let consortium = null;

    if (props.params.consortiumId) {
      const data = ApolloClient.readQuery({ query: fetchAllConsortiaFunc });
      consortium = data.fetchAllConsortia.find(cons => cons.id === props.params.consortiumId);
      delete consortium.__typename;
    }

    this.state = {
      owner: !props.params.consortiumId || consortium.owners.indexOf(props.auth.user.id) !== -1,
      pipeline: {
        steps: [],
      },
    };

    this.addStep = this.addStep.bind(this);
    this.moveStep = this.moveStep.bind(this);
    this.updateStep = this.updateStep.bind(this);
  }

  addStep(computation) {
    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: [
          ...prevState.pipeline.steps,
          {
            id: shortid.generate(),
            controller: { type: 'single', options: {} },
            computations: [
              { ...computation },
            ],
            ioMap: { covariates: [] },
          },
        ],
      },
    }));
  }

  moveStep(id, swapId) {
    let index;

    const movedStepIndex = this.state.pipeline.steps.findIndex(step => step.id === id);
    const movedStep = this.state.pipeline.steps[movedStepIndex];

    if (swapId !== null) {
      index = this.state.pipeline.steps.findIndex(step => step.id === swapId);
    } else {
      index = this.state.pipeline.steps.findIndex(step => step.id === id);
    }

    // Remap covariates to new indices if required
    const newArr = this.state.pipeline.steps
      .map((step, stepIndex) => {
        return {
          ...step,
          ioMap: {
            ...step.ioMap,
            covariates: step.ioMap.covariates.map((cov) => {
              if (index >= stepIndex && movedStepIndex < stepIndex) {
                return { ...cov, source: {} };
              } else if (movedStepIndex === cov.source.pipelineIndex) {
                return {
                  ...cov,
                  source: {
                    ...cov.source,
                    pipelineIndex: index,
                    inputLabel: cov.source.inputLabel.replace(`Computation ${cov.source.pipelineIndex + 1}`, `Computation ${index + 1}`),
                  },
                };
              } else if (index <= cov.source.pipelineIndex
                          && movedStepIndex > cov.source.pipelineIndex) {
                return {
                  ...cov,
                  source: {
                    ...cov.source,
                    pipelineIndex: cov.source.pipelineIndex + 1,
                    inputLabel: cov.source.inputLabel.replace(`Computation ${cov.source.pipelineIndex + 1}`, `Computation ${cov.source.pipelineIndex + 2}`),
                  },
                };
              } else if (movedStepIndex < cov.source.pipelineIndex
                          && index >= cov.source.pipeligitneIndex
                          && index < stepIndex) {
                return {
                  ...cov,
                  source: {
                    ...cov.source,
                    pipelineIndex: cov.source.pipelineIndex - 1,
                    inputLabel: cov.source.inputLabel.replace(`Computation ${cov.source.pipelineIndex + 1}`, `Computation ${cov.source.pipelineIndex}`),
                  },
                };
              }

              return cov;
            }),
          },
        };
      })
      .filter(step => step.id !== id);

    newArr.splice(
      index,
      0,
      {
        ...movedStep,
        ioMap: {
          ...movedStep.ioMap,
          covariates: movedStep.ioMap.covariates.map((cov) => {
            if (cov.source.pipelineIndex >= index) {
              return { ...cov, source: {} };
            }

            return cov;
          }),
        },
      }
    );

    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: newArr,
      },
    }));
  }

  updateStep(step) {
    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: update(prevState.pipeline.steps, {
          $splice: [[prevState.pipeline.steps.findIndex(s => s.id === step.id), 1, step]],
        }),
      },
    }));
  }

  render() {
    const { allComputations, connectDropTarget } = this.props;

    const title = 'New Pipeline';

    return connectDropTarget(
      <div>
        <div className="page-header clearfix">
          <h1 className="pull-left">{title}</h1>
        </div>
        <Form>
          <FormGroup controlId="name">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              type="input"
              inputRef={(input) => { this.name = input; }}
            />
          </FormGroup>

          <FormGroup controlId="description">
            <ControlLabel>Description</ControlLabel>
            <FormControl
              componentClass="textarea"
              inputRef={(input) => { this.description = input; }}
            />
          </FormGroup>

          <Checkbox inline>Share this pipeline with other consortia</Checkbox>

          <p style={{ padding: '30px 0 10px 0' }}>
            Build your pipelines by adding computation steps in the space below.
            Arrange computations vertically to determine their order from first
            (highest) to last (lowest):
          </p>

          <DropdownButton
            bsStyle="primary"
            id="computation-dropdown"
            pullRight
            title={
              <span>
                <span aria-hidden="true" className="glphicon glyphicon-plus" /> Add Computation Step
              </span>
            }
          >
            {allComputations.map(comp => (
              <MenuItem
                eventKey={comp.id}
                key={comp.id}
                onClick={() => this.addStep(comp)}
              >
                {comp.meta.name}
              </MenuItem>
            ))}
          </DropdownButton>

          <Row>
            <Col sm={12}>
              {this.state.pipeline.steps.length > 0 &&
                <Accordion>
                  {this.state.pipeline.steps.map((step, index) => (
                    <PipelineStep
                      computationId={step.computations[0].id}
                      eventKey={step.id}
                      id={step.id}
                      key={step.id}
                      moveStep={this.moveStep}
                      owner={this.state.owner}
                      pipelineIndex={index}
                      previousComputationIds={
                        this.state.pipeline.steps
                          .filter((s, i) => i < index)
                          .map(s => s.computations[0].id)
                      }
                      step={step}
                      updateStep={this.updateStep}
                    />
                  ))}
                  
                </Accordion>
              }
              {!this.state.pipeline.steps.length &&
                <Well bsSize="small" style={{ margin: '10px 0' }}>
                  <em>No computations added</em>
                </Well>
              }
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

Pipeline.propTypes = {
  auth: PropTypes.object.isRequired,
  allComputations: PropTypes.array.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const PipelineWithData = graphql(fetchAllComputationsFunc, {
  props: ({ data: { loading, fetchAllComputations } }) => ({
    loading,
    allComputations: fetchAllComputations,
  }),
})(Pipeline);

export default compose(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend),
  DropTarget(ItemTypes.COMPUTATION, computationTarget, collect)
)(PipelineWithData);
