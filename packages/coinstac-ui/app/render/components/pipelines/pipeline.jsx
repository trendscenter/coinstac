import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { graphql, withApollo } from 'react-apollo';
import { DragDropContext, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import NumberFormat from 'react-number-format';
import shortid from 'shortid';
import {
  isEqual, isEmpty, get, omit,
} from 'lodash';
import update from 'immutability-helper';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import ListDeleteModal from '../common/list-delete-modal';
import StatusButtonWrapper from '../common/status-button-wrapper';
import PipelineStep from './pipeline-step';
import ItemTypes from './pipeline-item-types';
import {
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_PIPELINE_QUERY,
  SAVE_PIPELINE_MUTATION,
  SAVE_ACTIVE_PIPELINE_MUTATION,
  FETCH_ALL_USERS_QUERY,
  USER_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import {
  getDocumentByParam,
  saveDocumentProp,
  consortiumSaveActivePipelineProp,
  getAllAndSubProp,
} from '../../state/graphql/props';
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog';
import { isPipelineOwner } from '../../utils/helpers';

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

const styles = theme => ({
  title: {
    marginBottom: theme.spacing.unit * 2,
  },
  formControl: {
    marginBottom: theme.spacing.unit * 2,
  },
  owningConsortiumButtonTitle: {
    marginBottom: theme.spacing.unit,
  },
  savePipelineButtonContainer: {
    textAlign: 'right',
    marginBottom: theme.spacing.unit * 2,
  },
  tooltipPaper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    backgroundColor: '#fef7e4',
    textAlign: 'center',
  },
  tooltip: {
    color: '#ab8e6b',
  },
});

const NumberFormatCustom = ({ inputRef, onChange, ...other }) => (
  <NumberFormat
    getInputRef={inputRef}
    onValueChange={values => onChange({
      target: {
        value: values.value,
      },
    })
    }
    isNumericString
    suffix=" minutes"
    {...other}
  />
);

class Pipeline extends Component {
  constructor(props) {
    super(props);

    let consortium = null;
    let pipeline = {
      name: '',
      description: '',
      timeout: null,
      owningConsortium: '',
      shared: false,
      steps: [],
      delete: false,
      limitOutputToOwner: false,
    };

    // if routed from New Pipeline button on consortium page

    const { consortiumId, runId } = props.params;

    if (consortiumId) {
      const data = props.client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
      consortium = data.fetchAllConsortia.find(cons => cons.id === consortiumId);
      pipeline.owningConsortium = consortium.id;
    }

    if (runId) {
      const { runs } = props;
      runs.filter(run => run.id === runId);
      pipeline = get(runs, '0.pipelineSnapshot');
    }

    this.state = {
      consortium,
      owner: true,
      pipeline,
      selectedId: pipeline.steps.length ? pipeline.steps[0].id : null,
      startingPipeline: pipeline,
      openOwningConsortiumMenu: false,
      openAddComputationStepMenu: false,
      showModal: false,
      savingStatus: 'init',
    };
  }

  // eslint-disable-next-line
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { consortium, pipeline, selectedId } = this.state;

    if (isEmpty(consortium) && nextProps.consortia.length
      && pipeline.id && pipeline.owningConsortium) {
      this.setConsortium();
    }

    let newSelectedId = null;
    if (selectedId) {
      newSelectedId = selectedId;
    } else if (nextProps.activePipeline && nextProps.activePipeline.steps.length) {
      newSelectedId = nextProps.activePipeline.steps[0].id;
    }

    if (nextProps.activePipeline && !pipeline.id) {
      const { activePipeline: { __typename, ...other } } = nextProps;
      this.setState(
        { pipeline: { ...other }, selectedId: newSelectedId, startingPipeline: { ...other } },
        () => {
          if (nextProps.consortia.length && pipeline.owningConsortium) {
            this.setConsortium();
          }
        }
      );
    }
  }

  setConsortium = () => {
    const { auth: { user }, client, params } = this.props;
    const { pipeline } = this.state;
    const { owningConsortium } = pipeline;

    const owner = params.runId ? false : isPipelineOwner(user.permissions, owningConsortium);

    const data = client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
    const consortium = data.fetchAllConsortia.find(cons => cons.id === owningConsortium);

    if (consortium) {
      delete consortium.__typename;
    }

    this.setState(prevState => ({
      owner,
      consortium,
      pipeline: { ...prevState.pipeline, owningConsortium },
      startingPipeline: { ...prevState.pipeline, owningConsortium },
    }));
  }

  addStep = (computation) => {
    const controllerType = computation.computation.remote ? 'decentralized' : 'local';

    const id = shortid.generate();

    this.accordionSelect(id);

    this.setState(prevState => ({
      openAddComputationStepMenu: false,
      pipeline: {
        ...prevState.pipeline,
        steps: [
          ...prevState.pipeline.steps,
          {
            id,
            controller: { type: controllerType, options: {} },
            computations: [
              { ...computation },
            ],
            inputMap: {},
          },
        ],
      },
    }));
    // () => this.updateStorePipeline());
  }

  accordionSelect = (selectedId) => {
    this.setState({ selectedId });
  }

  moveStep = (id, swapId) => {
    const { pipeline } = this.state;
    const { steps } = pipeline;

    const movedStepIndex = steps.findIndex(step => step.id === id);
    const movedStep = steps[movedStepIndex];

    const index = steps.findIndex(step => step.id === (swapId || id));

    // Remap inputMap props to new indices if required
    const newArr = steps
      .map((step, stepIndex) => {
        let inputMap = { ...step.inputMap };

        inputMap = Object.assign({},
          ...Object.keys(inputMap).map((key) => {
            if (key !== 'covariates' && 'fromCache' in inputMap[key]) {
              const cacheStep = inputMap[key].fromCache.step;
              const { variable, label } = inputMap[key].fromCache;

              if (index >= stepIndex && movedStepIndex < stepIndex) {
                return { [key]: {} };
              } if (movedStepIndex === cacheStep) {
                return { [key]: { fromCache: { step: index, variable, label } } };
              } if (index <= cacheStep && movedStepIndex > cacheStep) {
                return {
                  [key]: { fromCache: { step: cacheStep + 1, variable, label } },
                };
              } if (movedStepIndex < cacheStep && index >= cacheStep && index < stepIndex) {
                return {
                  [key]: { fromCache: { step: cacheStep - 1, variable, label } },
                };
              }
            }

            return { [key]: inputMap[key] };
          }));

        if ('covariates' in inputMap && 'ownerMappings' in inputMap.covariates && inputMap.covariates.ownerMappings.length) {
          let covariateMappings = [...inputMap.covariates.ownerMappings];

          covariateMappings = inputMap.covariates.ownerMappings
            .filter(cov => cov.fromCache)
            .map((cov) => {
              if (index >= stepIndex && movedStepIndex < stepIndex) {
                return {};
              } if (movedStepIndex === cov.fromCache.step) {
                return { fromCache: { ...cov.fromCache, step: index } };
              } if (index <= cov.fromCache.step && movedStepIndex > cov.fromCache.step) {
                return { fromCache: { ...cov.fromCache, step: cov.fromCache.step + 1 } };
              } if (movedStepIndex < cov.fromCache.step
                && index >= cov.fromCache.step && index < stepIndex) {
                return { fromCache: { ...cov.fromCache, step: cov.fromCache.step - 1 } };
              }

              return cov;
            });

          inputMap = {
            ...inputMap,
            covariates: {
              ownerMappings: covariateMappings,
            },
          };
        }

        return {
          ...step,
          inputMap,
        };
      })
      .filter(step => step.id !== id);

    newArr.splice(index, 0, {
      ...movedStep,
      inputMap: Object.assign(
        {},
        ...Object.keys(movedStep.inputMap).map((key) => {
          if (key !== 'covariates' && 'fromCache' in movedStep.inputMap[key]
            && movedStep.inputMap[key].step >= index) {
            return { [key]: {} };
          } if (key === 'covariates' && 'ownerMappings' in movedStep.inputMap.covariates && movedStep.inputMap.covariates.ownerMappings.length) {
            return {
              [key]: movedStep.inputMap[key].ownerMappings
                .filter(cov => cov.fromCache)
                .map((cov) => {
                  if (cov.fromCache.step >= index) {
                    return {};
                  }

                  return cov;
                }),
            };
          }

          return { [key]: { ...movedStep.inputMap[key] } };
        })
      ),
    });

    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: newArr,
      },
    }));
    // () => this.updateStorePipeline());
  }

  updateStorePipeline = () => {
    const { client } = this.props;
    const { pipeline } = this.state;

    const data = client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
    data.fetchPipeline = { ...pipeline, __typename: 'Pipeline' };

    client.writeQuery({ query: FETCH_PIPELINE_QUERY, data });
  }

  updateStep = (step) => {
    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        steps: update(prevState.pipeline.steps, {
          $splice: [[prevState.pipeline.steps.findIndex(s => s.id === step.id), 1, step]],
        }),
      },
    }));
  }

  deleteStep = () => {
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

  closeModal = () => {
    this.setState({ showModal: false });
  }

  openModal = (stepId) => {
    this.setState({
      showModal: true,
      stepToDelete: stepId,
    });
  }

  updatePipeline = (payload) => {
    const { param, value, consortiumName } = payload;

    if (param === 'owningConsortium') {
      this.setState({
        openOwningConsortiumMenu: false,
        consortium: { id: value, name: consortiumName },
      });
    }

    this.setState(prevState => ({
      pipeline: { ...prevState.pipeline, [param]: value },
    }));
    // this.updateStorePipeline());
  }

  checkPipeline = () => {
    const { startingPipeline, pipeline } = this.state;
    return isEqual(startingPipeline, pipeline);
  }

  savePipeline = async () => {
    const {
      auth: { user }, notifySuccess, notifyError, saveActivePipeline, savePipeline,
    } = this.props;
    const { pipeline } = this.state;

    const isActive = get(pipeline, 'isActive', false);

    const omittedPipeline = omit(pipeline, ['isActive']);

    this.setState({ savingStatus: 'pending' });

    try {
      const { data } = await savePipeline({
        ...omittedPipeline,
        owner: user.id,
        steps: omittedPipeline.steps.map(step => ({
          id: step.id,
          computations: step.computations.map(comp => comp.id),
          inputMap: step.inputMap,
          dataMeta: step.dataMeta,
          controller: {
            id: step.controller.id,
            type: step.controller.type,
            options: step.controller.options,
          },
        })),
      });

      const { savePipeline: { __typename, ...other } } = data;
      const newPipeline = { ...pipeline, ...other };

      this.setState({
        pipeline: newPipeline,
        startingPipeline: newPipeline,
        savingStatus: 'success',
      });

      notifySuccess('Pipeline Saved');

      if (isActive) {
        const { savePipeline } = data;
        await saveActivePipeline(savePipeline.owningConsortium, savePipeline.id);
      }
    } catch (error) {
      notifyError(get(error.graphQLErrors, '0.message', 'Failed to save pipeline'));

      this.setState({ savingStatus: 'fail' });
    }
  }

  openOwningConsortiumMenu = (event) => {
    this.owningConsortiumButtonElement = event.currentTarget;
    this.setState({ openOwningConsortiumMenu: true });
  }

  closeOwningConsortiumMenu = () => {
    this.setState({ openOwningConsortiumMenu: false });
  }

  openAddComputationStepMenu = (event) => {
    this.addComputationStepButtonElement = event.currentTarget;
    this.setState({ openAddComputationStepMenu: true });
  }

  closeAddComputationStepMenu = () => {
    this.setState({ openAddComputationStepMenu: false });
  }

  sortComputations = () => {
    const { computations } = this.props;
    if (computations && computations.length > 0) {
      return computations.slice().sort((a, b) => {
        const nameA = a.meta.name.toLowerCase();
        const nameB = b.meta.name.toLowerCase();

        if (nameA < nameB) {
          return -1;
        }

        return (nameA > nameB) ? 1 : 0;
      });
    }
  }

  render() {
    const {
      connectDropTarget, consortia, users, classes, auth,
    } = this.props;
    const {
      consortium,
      pipeline,
      owner,
      openOwningConsortiumMenu,
      openAddComputationStepMenu,
      showModal,
      savingStatus,
    } = this.state;

    const isEditing = !!pipeline.id;
    const title = isEditing ? 'Pipeline Edit' : 'Pipeline Creation';

    const sortedComputations = this.sortComputations();

    return connectDropTarget(
      <div>
        <div className="page-header">
          <Typography variant="h4" className={classes.title}>
            {title}
          </Typography>
        </div>
        <ValidatorForm instantValidate noValidate onSubmit={this.savePipeline}>
          <TextValidator
            id="name"
            label="Name"
            fullWidth
            required
            disabled={!owner}
            value={pipeline.name || ''}
            name="name"
            validators={['required']}
            errorMessages={['Name is required']}
            withRequiredValidator
            onChange={evt => this.updatePipeline({ param: 'name', value: evt.target.value })}
            className={classes.formControl}
          />
          <TextValidator
            id="description"
            label="Description"
            multiline
            fullWidth
            required
            disabled={!owner}
            value={pipeline.description || ''}
            name="description"
            validators={['required']}
            errorMessages={['Description is required']}
            withRequiredValidator
            onChange={evt => this.updatePipeline({ param: 'description', value: evt.target.value })}
            className={classes.formControl}
          />
          <TextValidator
            id="timeout"
            label="Timeout for clients (default: infinite)"
            fullWidth
            disabled={!owner}
            value={pipeline.timeout}
            name="timeout"
            validators={['minNumber: 0', 'matchRegexp:[0-9]*']}
            errorMessages={['Timeout must be positive']}
            onChange={evt => this.updatePipeline({ param: 'timeout', value: evt.target.value })}
            className={classes.formControl}
            InputProps={{
              inputComponent: NumberFormatCustom,
            }}
          />
          {!isEditing && (
            <FormControlLabel
              control={(
                <Checkbox
                  checked={pipeline.isActive}
                  disabled={!owner}
                  onChange={evt => this.updatePipeline({ param: 'isActive', value: evt.target.checked })}
                />
              )}
              label="Set active on this consortium"
              className={classes.formControl}
            />
          )}
          <FormControlLabel
            control={(
              <Checkbox
                checked={pipeline.limitOutputToOwner || false}
                disabled={!owner}
                onChange={evt => this.updatePipeline({ param: 'limitOutputToOwner', value: evt.target.checked })}
              />
            )}
            label="Only send results to consortia owner"
            className={classes.formControl}
          />
          <div className={classes.formControl}>
            <Typography variant="title" className={classes.owningConsortiumButtonTitle}>Owning Consortium</Typography>
            <Button
              id="pipelineconsortia"
              variant="contained"
              color="primary"
              disabled={!owner}
              onClick={this.openOwningConsortiumMenu}
            >
              {get(consortium, 'name', 'Consortia')}
            </Button>
            <Menu
              id="consortium-menu"
              anchorEl={this.owningConsortiumButtonElement}
              open={openOwningConsortiumMenu}
              onClose={this.closeOwningConsortiumMenu}
            >
              {consortia && consortia
                .filter(cons => cons.owners.includes(auth.user.id))
                .map(cons => (
                  <MenuItem
                    key={cons.id}
                    onClick={() => this.updatePipeline({
                      param: 'owningConsortium',
                      value: cons.id,
                      consortiumName: cons.name,
                    })
                    }
                  >
                    {cons.name}
                  </MenuItem>
                ))
              }
            </Menu>
          </div>
          <div className={classes.savePipelineButtonContainer}>
            <StatusButtonWrapper status={savingStatus}>
              <Button
                key="save-pipeline-button"
                variant="contained"
                color="primary"
                disabled={!owner || !consortium || savingStatus === 'pending'}
                type="submit"
              >
                Save Pipeline
              </Button>
            </StatusButtonWrapper>
          </div>
          <FormControlLabel
            control={(
              <Checkbox
                checked={pipeline.shared}
                disabled={!owner}
                onChange={evt => this.updatePipeline({ param: 'shared', value: evt.target.checked })}
              />
            )}
            label="Share this pipeline with other consortia"
            className={classes.formControl}
          />
          <Paper className={classes.tooltipPaper}>
            <Typography className={classes.tooltip} variant="body1">
              Build your pipelines by adding computation steps in the space below.
              Arrange computations vertically to determine their order from first
              (highest) to last (lowest)
            </Typography>
          </Paper>
          <div className={classes.formControl}>
            <Button
              id="computation-dropdown"
              variant="contained"
              color="primary"
              disabled={!owner}
              onClick={this.openAddComputationStepMenu}
            >
              Add Computation Step
            </Button>
            <Menu
              id="computation-menu"
              anchorEl={this.addComputationStepButtonElement}
              open={openAddComputationStepMenu}
              onClose={this.closeAddComputationStepMenu}
            >
              {sortedComputations && sortedComputations.map(comp => (
                <MenuItem
                  key={comp.id}
                  onClick={() => this.addStep(comp)}
                >
                  {comp.meta.name}
                </MenuItem>
              ))}
            </Menu>
          </div>
          <ListDeleteModal
            close={this.closeModal}
            deleteItem={this.deleteStep}
            itemName="step"
            show={showModal}
          />
          <div>
            {pipeline.steps.length > 0 && pipeline.steps.map((step, index) => (
              <PipelineStep
                computationId={step.computations[0].id}
                deleteStep={this.openModal}
                eventKey={step.id}
                id={step.id}
                key={step.id}
                moveStep={this.moveStep}
                owner={owner}
                pipelineIndex={index}
                previousComputationIds={
                  pipeline.steps
                    .filter((_s, i) => i < index)
                    .map(s => s.computations[0].id)
                }
                step={step}
                updateStep={this.updateStep}
                users={users}
              />
            ))}
          </div>
          {!pipeline.steps.length && (
            <Typography variant="body1">
              No computations added
            </Typography>
          )}
        </ValidatorForm>
      </div>
    );
  }
}

Pipeline.defaultProps = {
  activePipeline: null,
  runs: null,
  users: [],
  subscribeToComputations: null,
  subscribeToPipelines: null,
};

Pipeline.propTypes = {
  activePipeline: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  computations: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  runs: PropTypes.array,
  users: PropTypes.array,
  connectDropTarget: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  savePipeline: PropTypes.func.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

const PipelineWithData = compose(
  graphql(FETCH_PIPELINE_QUERY, getDocumentByParam(
    'pipelineId',
    'activePipeline',
    'fetchPipeline'
  )),
  graphql(SAVE_PIPELINE_MUTATION, saveDocumentProp('savePipeline', 'pipeline')),
  graphql(SAVE_ACTIVE_PIPELINE_MUTATION, consortiumSaveActivePipelineProp('saveActivePipeline')),
  graphql(FETCH_ALL_USERS_QUERY, getAllAndSubProp(
    USER_CHANGED_SUBSCRIPTION,
    'users',
    'fetchAllUsers',
    'subscribeToUsers',
    'userChanged'
  ))
)(Pipeline);

const PipelineWithAlert = compose(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend),
  DropTarget(ItemTypes.COMPUTATION, computationTarget, collect),
  withApollo
)(PipelineWithData);

const connectedComponent = connect(mapStateToProps, {
  notifySuccess,
  notifyError,
})(PipelineWithAlert);

export default withStyles(styles)(connectedComponent);
