import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { DragDropContext, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import shortid from 'shortid';
import { isEqual, isEmpty } from 'lodash';
import update from 'immutability-helper';
import {
  Accordion,
  Alert,
  Button,
  Checkbox,
  Col,
  ControlLabel,
  DropdownButton,
  Form,
  FormControl,
  FormGroup,
  MenuItem,
  Modal,
  Row,
  SplitButton,
  Well,
} from 'react-bootstrap';
import ApolloClient from '../../state/apollo-client';
import PipelineStep from './pipeline-step';
import ItemTypes from './pipeline-item-types';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  SAVE_PIPELINE_MUTATION,
} from '../../state/graphql/functions';
import { consortiaProp, getAllAndSubProp, savePipelineProp } from '../../state/graphql/props';

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
    let pipeline = null;

    if (props.params.pipelineId) {
      const data = ApolloClient.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
      pipeline = data.fetchAllPipelines.find(cons => cons.id === props.params.pipelineId);
      delete pipeline.__typename;
    }

    if (!pipeline) {
      pipeline = {
        name: '',
        description: '',
        owningConsortium: '',
        shared: false,
        steps: [],
      };
    }

    // if routed from New Pipeline button on consortium page
    if (props.params.consortiumId) {
      const data = ApolloClient.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
      consortium = data.fetchAllConsortia.find(cons => cons.id === props.params.consortiumId);
      pipeline.owningConsortium = consortium.id;
    }

    this.state = {
      owner: !props.params.consortiumId || consortium.owners.indexOf(props.auth.user.id) !== -1,
      pipeline,
      consortium,
      startingPipeline: pipeline,
    };

    this.addStep = this.addStep.bind(this);
    this.moveStep = this.moveStep.bind(this);
    this.updateStep = this.updateStep.bind(this);
    this.deleteStep = this.deleteStep.bind(this);
    this.updatePipeline = this.updatePipeline.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.savePipeline = this.savePipeline.bind(this);
    this.checkPipeline = this.checkPipeline.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (isEmpty(this.state.consortium) && nextProps.consortia) {
      if (nextProps.consortia.length) {
        let consortiumId = this.state.pipeline.owningConsortium;
        let consortium = nextProps.consortia[0];
        if (!consortiumId.length) {
          consortiumId = nextProps.consortia[0].id;
        } else {
          const data = ApolloClient.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
          consortium = data.fetchAllConsortia.find(cons => cons.id === consortiumId);
          delete consortium.__typename;
        }
        this.setState(prevState => ({
          consortium,
          pipeline: { ...prevState.pipeline, owningConsortium: consortiumId },
          startingPipeline: { ...prevState.pipeline, owningConsortium: consortiumId },
        }));
      }
    }

    if (nextProps.computations && !this.state.unsubscribeComputations) {
      this.setState({ unsubscribeComputations: this.props.subscribeToComputations(null) });
    }
  }

  componentWillUnmount() {
    this.state.unsubscribeComputations();
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
                          && index >= cov.source.pipelineIndex
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

  deleteStep() {
    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: update(prevState.pipeline.steps, {
          $splice: [[prevState.pipeline.steps.findIndex(s => s.id === prevState.stepToDelete), 1]],
        }),
      },
    }));
    this.closeModal();
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  openModal(stepId) {
    this.setState({
      showModal: true,
      stepToDelete: stepId,
    });
  }

  updatePipeline(update) {
    if (update.param === 'owningConsortium') {
      this.setState({ consortium: { id: update.value, name: update.consortiumName } });
    }

    this.setState(prevState => ({
      pipeline: { ...prevState.pipeline, [update.param]: update.value },
    }));
  }

  checkPipeline() {
    return isEqual(this.state.startingPipeline, this.state.pipeline);
  }

  savePipeline(e) {
    e.preventDefault();

    this.props.savePipeline({
      ...this.state.pipeline,
      steps: this.state.pipeline.steps.map(step =>
        ({
          id: step.id,
          computations: step.computations.map(comp => comp.id),
          ioMap: step.ioMap,
          controller: { type: step.controller.type, options: step.controller.options },
        })
      ),
    })
    .then((res) => {
      const pipeline = {
        id: res.data.savePipeline.id,
        name: res.data.savePipeline.name,
        description: res.data.savePipeline.description,
        owningConsortium: res.data.savePipeline.owningConsortium,
        shared: res.data.savePipeline.shared,
        steps: res.data.savePipeline.steps,
      };

      this.setState({
        pipeline,
        startingPipeline: pipeline,
      });
      // TODO: Use redux to display success/failure messages after mutations
    })
    .catch((error) => {
      console.log(error);
    });
  }

  render() {
    const { computations, connectDropTarget, consortia } = this.props;
    const { consortium, pipeline } = this.state;
    const title = pipeline.id ? 'Pipeline Edit' : 'Pipeline Creation';

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
              onChange={evt => this.updatePipeline({ param: 'name', value: evt.target.value })}
              defaultValue={pipeline.name}
            />
          </FormGroup>

          <FormGroup controlId="description">
            <ControlLabel>Description</ControlLabel>
            <FormControl
              componentClass="textarea"
              onChange={evt => this.updatePipeline({ param: 'description', value: evt.target.value })}
              defaultValue={pipeline.description}
            />
          </FormGroup>

          <Row>
            <Col sm={12}>
              <ControlLabel>Owning Consortium</ControlLabel>
            </Col>
          </Row>

          <Row>
            <Col sm={12}>
              {consortia &&
              <SplitButton
                bsStyle="info"
                title={consortium ? consortium.name : 'Consortia'}
                id="pipelineconsortia"
                onSelect={(value, e) => this.updatePipeline({
                  param: 'owningConsortium',
                  value,
                  consortiumName: e.target.innerHTML,
                })}
              >
                {consortia.map((con) => {
                  return con.owners.includes(this.props.auth.user.id) ?
                    <MenuItem
                      eventKey={con.id}
                      key={con.id}
                    >
                      {con.name}
                    </MenuItem>
                    : 0;
                }).filter(con => con) }
              </SplitButton>}
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <Button
                key="save-pipeline-button"
                bsStyle="success"
                className="pull-right"
                disabled={!this.state.pipeline.name.length ||
                  !this.state.pipeline.description.length ||
                  !consortium || this.checkPipeline() || !this.state.pipeline.steps.length}
                onClick={this.savePipeline}
              >
                Save Pipeline
              </Button>
            </Col>
          </Row>

          <Row>
            <Col sm={12}>
              <Checkbox
                defaultChecked={this.state.pipeline.shared}
                onChange={evt => this.updatePipeline({ param: 'shared', value: evt.target.checked })}
                inline
              >
                Share this pipeline with other consortia
              </Checkbox>
            </Col>
          </Row>
          <Row style={{ padding: '10px 0px 10px' }}>
            <Col sm={12}>
              <Alert bsStyle="warning">
                Build your pipelines by adding computation steps in the space below.
                Arrange computations vertically to determine their order from first
                (highest) to last (lowest)
              </Alert>
            </Col>
          </Row>

          <DropdownButton
            bsStyle="primary"
            id="computation-dropdown"
            title={
              <span>
                <span aria-hidden="true" className="glphicon glyphicon-plus" /> Add Computation Step
              </span>
            }
          >
            {computations.map(comp => (
              <MenuItem
                eventKey={comp.id}
                key={comp.id}
                onClick={() => this.addStep(comp)}
              >
                {comp.meta.name}
              </MenuItem>
            ))}
          </DropdownButton>

          <Modal show={this.state.showModal} onHide={this.closeModal}>
            <Modal.Header closeButton>
              <Modal.Title>Delete</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h4>Are you sure you want to delete this step?</h4>
            </Modal.Body>
            <Modal.Footer>
              <Button className="pull-left" onClick={this.closeModal}>Cancel</Button>
              <Button bsStyle="danger" onClick={this.deleteStep}>Delete</Button>
            </Modal.Footer>
          </Modal>

          <Row>
            <Col sm={12}>
              {this.state.pipeline.steps.length > 0 &&
                <Accordion>
                  {this.state.pipeline.steps.map((step, index) => (
                    <PipelineStep
                      computationId={step.computations[0].id}
                      deleteStep={this.openModal}
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

Pipeline.defaultProps = {
  computations: null,
  consortia: [],
  subscribeToComputations: null,
};

Pipeline.propTypes = {
  auth: PropTypes.object.isRequired,
  computations: PropTypes.array,
  connectDropTarget: PropTypes.func.isRequired,
  consortia: PropTypes.array,
  params: PropTypes.object.isRequired,
  savePipeline: PropTypes.func.isRequired,
  subscribeToComputations: PropTypes.func,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const PipelineWithData = compose(
  graphql(FETCH_ALL_COMPUTATIONS_QUERY, getAllAndSubProp(
    COMPUTATION_CHANGED_SUBSCRIPTION,
    'computations',
    'fetchAllComputations',
    'subscribeToComputations',
    'computationChanged'
  )),
  graphql(FETCH_ALL_CONSORTIA_QUERY, consortiaProp),
  graphql(SAVE_PIPELINE_MUTATION, savePipelineProp)
)(Pipeline);

export default compose(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend),
  DropTarget(ItemTypes.COMPUTATION, computationTarget, collect)
)(PipelineWithData);
