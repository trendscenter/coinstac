import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { DragDropContext, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import PropTypes from 'prop-types';
import { graphql, withApollo } from 'react-apollo';
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
import PipelineStep from './pipeline-step';
import ItemTypes from './pipeline-item-types';
import {
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_PIPELINE_QUERY,
  SAVE_PIPELINE_MUTATION,
} from '../../state/graphql/functions';
import {
  getDocumentByParam,
  saveDocumentProp,
} from '../../state/graphql/props';

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
    let pipeline = {
      name: '',
      description: '',
      owningConsortium: '',
      shared: false,
      steps: [],
      delete: false,
    };

    // if routed from New Pipeline button on consortium page
    if (props.params.consortiumId) {
      const data = props.client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
      consortium = data.fetchAllConsortia.find(cons => cons.id === props.params.consortiumId);
      pipeline.owningConsortium = consortium.id;
    }

    if (props.params.runId) {
      const runs = props.runs;
      runs.filter(run => run.id === props.params.runId);
      pipeline = runs[0].pipelineSnapshot;
    }

    this.state = {
      consortium,
      owner: true,
      pipeline,
      startingPipeline: pipeline,
    };

    this.addStep = this.addStep.bind(this);
    this.checkPipeline = this.checkPipeline.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.deleteStep = this.deleteStep.bind(this);
    this.moveStep = this.moveStep.bind(this);
    this.openModal = this.openModal.bind(this);
    this.savePipeline = this.savePipeline.bind(this);
    this.setConsortium = this.setConsortium.bind(this);
    this.updatePipeline = this.updatePipeline.bind(this);
    this.updateStep = this.updateStep.bind(this);
    this.updateStorePipeline = this.updateStorePipeline.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (isEmpty(this.state.consortium) && nextProps.consortia.length
      && this.state.pipeline.id && this.state.pipeline.owningConsortium) {
      this.setConsortium();
    }

    if (nextProps.activePipeline && !this.state.pipeline.id) {
      const { activePipeline: { __typename, ...other } } = nextProps;
      this.setState(
        { pipeline: { ...other }, startingPipeline: { ...other } },
        () => {
          if (nextProps.consortia.length && this.state.pipeline.owningConsortium) {
            this.setConsortium();
          }
        }
      );
    }
  }

  setConsortium() {
    const { auth: { user }, client } = this.props;
    let owner;
    if (this.props.params.runId) {
      owner = false;
    } else {
      owner = user.permissions.consortia[this.state.pipeline.owningConsortium] &&
      user.permissions.consortia[this.state.pipeline.owningConsortium].write;
    }
    const consortiumId = this.state.pipeline.owningConsortium;
    const data = client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
    const consortium = data.fetchAllConsortia.find(cons => cons.id === consortiumId);
    delete consortium.__typename;

    this.setState(prevState => ({
      owner,
      consortium,
      pipeline: { ...prevState.pipeline, owningConsortium: consortiumId },
      startingPipeline: { ...prevState.pipeline, owningConsortium: consortiumId },
    }));
  }

  addStep(computation) {
    let controllerType = 'local';
    if (computation.computation.remote) {
      controllerType = 'decentralized';
    }

    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: [
          ...prevState.pipeline.steps,
          {
            id: shortid.generate(),
            controller: { type: controllerType, options: {} },
            computations: [
              { ...computation },
            ],
            inputMap: { },
          },
        ],
      },
    }));
    // () => this.updateStorePipeline());
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

    // Remap inputMap props to new indices if required
    const newArr = this.state.pipeline.steps
      .map((step, stepIndex) => {
        let inputMap = { ...step.inputMap };

        inputMap = Object.assign({},
          ...Object.keys(inputMap).map((key) => {
            if (key !== 'covariates' && 'fromCache' in inputMap[key]) {
              const cacheStep = inputMap[key].fromCache.step;
              const variable = inputMap[key].fromCache.variable;
              const label = inputMap[key].fromCache.label;

              if (index >= stepIndex && movedStepIndex < stepIndex) {
                return { [key]: {} };
              } else if (movedStepIndex === cacheStep) {
                return { [key]: { fromCache: { step: index, variable, label } } };
              } else if (index <= cacheStep && movedStepIndex > cacheStep) {
                return {
                  [key]: { fromCache: { step: cacheStep + 1, variable, label } },
                };
              } else if (movedStepIndex < cacheStep
                          && index >= cacheStep
                          && index < stepIndex) {
                return {
                  [key]: { fromCache: { step: cacheStep - 1, variable, label } },
                };
              }
            }

            return { [key]: inputMap[key] };
          })
        );

        if ('covariates' in inputMap) {
          let covariates = [...inputMap.covariates];

          covariates = inputMap.covariates.map((cov) => {
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
          });

          inputMap = {
            ...inputMap,
            covariates,
          };
        }

        return {
          ...step,
          inputMap,
        };
      })
      .filter(step => step.id !== id);

    newArr.splice(
      index,
      0,
      {
        ...movedStep,
        inputMap: Object.assign(
          {},
          ...Object.keys(movedStep.inputMap).map((key) => {
            if (key !== 'covariates' && 'fromCache' in movedStep.inputMap[key] &&
              movedStep.inputMap[key].step >= index) {
              return { [key]: {} };
            } else if (key === 'covariates') {
              return {
                [key]: movedStep.inputMap.covariates.map((cov) => {
                  if (cov.source.pipelineIndex >= index) {
                    return { ...cov, source: {} };
                  }

                  return cov;
                }),
              };
            }

            return { [key]: { ...movedStep.inputMap[key] } };
          })
        ),
      }
    );

    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: newArr,
      },
    }));
    // () => this.updateStorePipeline());
  }

  updateStorePipeline() {
    const { client } = this.props;
    const data = client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
    data.fetchPipeline = { ...this.state.pipeline, __typename: 'Pipeline' };
    client.writeQuery({ query: FETCH_PIPELINE_QUERY, data });
  }

  updateStep(step) {
    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: update(prevState.pipeline.steps, {
          $splice: [[prevState.pipeline.steps.findIndex(s => s.id === step.id), 1, step]],
        }),
      },
    }), () => console.log(this.state.pipeline));
    // () => this.updateStorePipeline());
  }

  deleteStep() {
    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: update(prevState.pipeline.steps, {
          $splice: [[prevState.pipeline.steps.findIndex(s => s.id === prevState.stepToDelete), 1]],
        }),
      },
    }),
    () => this.updateStorePipeline());
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
    // this.updateStorePipeline());
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
          inputMap: step.inputMap,
          controller: {
            id: step.controller.id,
            type: step.controller.type,
            options: step.controller.options,
          },
        })
      ),
    })
    .then(({ data: { savePipeline: { __typename, ...other } } }) => {
      const pipeline = { ...this.state.pipeline, ...other };

      this.setState({
        pipeline,
        startingPipeline: pipeline,
      });
    })
    .catch(console.log);
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
              disabled={!this.state.owner}
              type="input"
              onChange={evt => this.updatePipeline({ param: 'name', value: evt.target.value })}
              value={pipeline.name || ''}
            />
          </FormGroup>

          <FormGroup controlId="description">
            <ControlLabel>Description</ControlLabel>
            <FormControl
              disabled={!this.state.owner}
              componentClass="textarea"
              onChange={evt => this.updatePipeline({ param: 'description', value: evt.target.value })}
              value={pipeline.description || ''}
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
                  disabled={!this.state.owner}
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
                </SplitButton>
              }
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <Button
                key="save-pipeline-button"
                bsStyle="success"
                className="pull-right"
                disabled={!this.state.owner || !this.state.pipeline.name.length ||
                  !this.state.pipeline.description.length ||
                  !consortium}
                onClick={this.savePipeline}
              >
                Save Pipeline
              </Button>
            </Col>
          </Row>

          <Row>
            <Col sm={12}>
              <Checkbox
                disabled={!this.state.owner}
                checked={this.state.pipeline.shared}
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
            disabled={!this.state.owner}
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
  activePipeline: null,
  runs: null,
  subscribeToComputations: null,
  subscribeToPipelines: null,
};

Pipeline.propTypes = {
  activePipeline: PropTypes.object,
  auth: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  computations: PropTypes.array.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  consortia: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  runs: PropTypes.array,
  savePipeline: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const PipelineWithData = compose(
  graphql(FETCH_PIPELINE_QUERY, getDocumentByParam(
    'pipelineId',
    'activePipeline',
    'fetchPipeline'
  )),
  graphql(SAVE_PIPELINE_MUTATION, saveDocumentProp('savePipeline', 'pipeline'))
)(Pipeline);

export default compose(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend),
  DropTarget(ItemTypes.COMPUTATION, computationTarget, collect),
  withApollo
)(PipelineWithData);
