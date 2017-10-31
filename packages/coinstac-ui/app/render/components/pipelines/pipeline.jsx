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
  Panel,
  Row,
  SplitButton,
  Well,
} from 'react-bootstrap';
import ApolloClient from '../../state/apollo-client';
import PipelineStep from './pipeline-step';
import ItemTypes from './pipeline-item-types';
import { fetchAllConsortiaFunc, fetchAllComputationsMetadataFunc, fetchAllPipelinesFunc, savePipelineFunc } from '../../state/graphql/functions';
import { computationsProp, consortiaProp, pipelineProp } from '../../state/graphql/props';

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
    let stepToDelete = null;
    let pipeline = null;

    if(props.params.pipelineId){
      const data = ApolloClient.readQuery({ query: fetchAllPipelinesFunc });
      pipeline = data.fetchAllPipelines.find(cons => cons.id === props.params.pipelineId);
      delete pipeline.__typename;
    }

    if(!pipeline){
      pipeline ={
        name: "",
        description: "",
        owningConsortia: "",
        steps: [],
      }
    }

    //if routed from New Pipeline button on consortium page
    if (props.params.consortiumId) {
      const data = ApolloClient.readQuery({ query: fetchAllConsortiaFunc });
      consortium = data.fetchAllConsortia.find(cons => cons.id === props.params.consortiumId);
      delete consortium.__typename;
      pipeline.owningConsortia = consortium.id;
    }

    this.state = {
      owner: !props.params.consortiumId || consortium.owners.indexOf(props.auth.user.id) !== -1,
      pipeline: pipeline,
      currentTitle: pipeline.name,
      consortium: consortium,
    };

    this.addStep = this.addStep.bind(this);
    this.moveStep = this.moveStep.bind(this);
    this.updateStep = this.updateStep.bind(this);
    this.deleteStep = this.deleteStep.bind(this);
    this.updatePipeline = this.updatePipeline.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
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

  componentWillReceiveProps(nextProps) {
    if (!this.state.consortium && nextProps.consortia) {
      this.setState(prevState => ({
        consortium: nextProps.consortia[0],
        pipeline: { ...prevState.pipeline, owningConsortia: nextProps.consortia[0].id },
      }));
    }
  }

  deleteStep(){
    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: update(prevState.pipeline.steps, {
          $splice: [[prevState.pipeline.steps.findIndex(s => s.id === prevState.stepToDelete), 1]],
        }),
      },
    }));
    this.close();
  }

  close() {
    this.setState({ showModal: false });
  }

  open(stepId) {
    this.setState({ 
      showModal: true,
      stepToDelete: stepId,
    });
  }

  updatePipeline(update) {
    if(update.param == 'owningConsortia')
      this.setState({ consortium: { id: update.value, name: update.corsortiaName }});
    this.setState(prevState => ({
      pipeline: { ...prevState.pipeline, [update.param]: update.value },
    }));
  }

  render() {
    const { computations, connectDropTarget, consortia, savePipeline } = this.props;
    const { consortium, pipeline, currentTitle } = this.state;
    const title = currentTitle != "" ? "Pipeline Edit" : 'Pipeline Creation';

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
              onChange={(evt) => this.updatePipeline({ param: 'name', value: evt.target.value })}
              defaultValue={ pipeline.name }
            />
          </FormGroup>

          <FormGroup controlId="description">
            <ControlLabel>Description</ControlLabel>
            <FormControl
              componentClass="textarea"
              onChange={(evt) => this.updatePipeline({ param: 'description', value: evt.target.value })}
              defaultValue={ pipeline.description }
            />
          </FormGroup>

          <Row>
            <Col sm={12}>
              <ControlLabel>Owning Consortia</ControlLabel>
            </Col>
          </Row>

          <Row>
            <Col sm={12}>
              {consortia &&
              <SplitButton 
                bsStyle="info" 
                title={consortium ? consortium.name : "Consortia"} 
                id="pipelineconsortia" 
                onSelect={(value, e) => this.updatePipeline({ param: 'owningConsortia', value: value, corsortiaName: e.target.innerHTML })}>

                {consortia.map(con => (
                  <MenuItem 
                    eventKey={con.id}
                    key={con.id}
                  >
                    {con.name}
                  </MenuItem>
                ))}
              </SplitButton>}
            </Col>
          </Row>
          
          <Row>
            <Col sm={12}>
              <Button
                key="save-pipeline-button"
                bsStyle="success"
                className="pull-right"
                onClick={() => savePipeline(pipeline)}>
                Save Pipeline
              </Button>
            </Col>
          </Row>
          
          <Row style={{ padding: '10px 0px 10px'}}>
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

          <Modal show={this.state.showModal} onHide={this.close}>
            <Modal.Header closeButton>
              <Modal.Title>Delete</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h4>Are you sure you want to delete this step?</h4>
            </Modal.Body>
            <Modal.Footer>
              <Button className="pull-left" onClick={this.close}>Cancel</Button>
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
                      deleteStep={this.open}
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
  computations: PropTypes.array.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  savePipeline: PropTypes.func.isRequired,
};

function mapStateToProps({ auth }) {
  return { auth };
}

const PipelineWithData = compose(
  graphql(fetchAllComputationsMetadataFunc, computationsProp), 
  graphql(fetchAllConsortiaFunc, consortiaProp),
  graphql(savePipelineFunc, {
    props: ({ mutate }) => ({
      savePipeline: pipeline => mutate({
        variables: { pipeline },
        update: (store, { data: { savePipeline } }) => {
          const data = store.readQuery({ query: fetchAllPipelinesFunc });
          const index = data.fetchAllPipelines.findIndex(cons => cons.id === savePipeline.id);
          if (index > -1) {
            data.fetchAllPipelines[index] = { ...savePipeline };
          } else {
            data.fetchAllPipelines.push(savePipeline);
          }
          store.writeQuery({ query: fetchAllPipelinesFunc, data });
        },
      }),
    }),
  }
))(Pipeline);

export default compose(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend),
  DropTarget(ItemTypes.COMPUTATION, computationTarget, collect)
)(PipelineWithData);
