import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Joyride from 'react-joyride';
import { graphql, withApollo } from '@apollo/react-hoc';
import { DragDropContext, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import NumberFormat from 'react-number-format';
import shortid from 'shortid';
import {
  isEqual, isEmpty, get, omit,
} from 'lodash';
import update from 'immutability-helper';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';
import HelpOutlineIcon from '@material-ui/icons/HelpOutlined';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import memoize from 'memoize-one';

import ListDeleteModal from '../common/list-delete-modal';
import Select from '../common/react-select';
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
  FETCH_ALL_HEADLESS_CLIENTS,
  FETCH_ALL_PIPELINES_QUERY,
} from '../../state/graphql/functions';
import {
  getDocumentByParam,
  saveDocumentProp,
  consortiumSaveActivePipelineProp,
  getAllAndSubProp,
} from '../../state/graphql/props';
import { tutorialChange } from '../../state/ducks/auth';
import { updateMapStatus } from '../../state/ducks/maps';
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog';
import {
  isPipelineOwner,
  getGraphQLErrorMessage,
  isUserInGroup,
} from '../../utils/helpers';
import STEPS from '../../constants/tutorial';
import vaultDescriptions from './vault-descriptions.json';

const VAULT_USERS_TOOLTIP = `Vault users are persistent nodes that can run some pipelines. If you add one or more vault users,
  the available pipelines list will be filtered by the ones that the vault users can run.`;

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
  formControl: {
    marginBottom: theme.spacing(2),
  },
  tooltipPaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: '#fef7e4',
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },
  tooltip: {
    color: '#ab8e6b',
  },
  vaultUserTitle: {
    marginRight: theme.spacing(1),
  },
  buttonWrapper: {
    display: 'flex',
    columnGap: theme.spacing(1),
    justifyContent: 'flex-end',
    marginBottom: theme.spacing(2),
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
  mapHeadlessUsers = memoize(
    (users, pipeline) => {
      if (!users) {
        return null;
      }

      return users
        .map(u => ({ label: u.name, value: u.id }))
        .filter((user) => {
          if (pipeline.headlessMembers) {
            return !(user.value in pipeline.headlessMembers);
          }

          return true;
        });
    }
  );

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
      isActive: false,
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
      selectedHeadlessMember: null,
      orderedComputations: null,
      showVaultDescriptionModal: false,
    };
  }

  componentDidMount() {
    const { consortium } = this.state;
    const { params, consortia } = this.props;

    if (isEmpty(consortium) && consortia.length > 0 && params.pipelineId) {
      this.setConsortiumWithActivePipeline();
    }
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
          if (nextProps.consortia.length && other.owningConsortium) {
            this.setConsortium();
          }
        }
      );
    }

    if (nextProps.consortia.length > 0 && consortium && consortium.id) {
      const newConsortium = nextProps.consortia.find(con => con.id === consortium.id);

      if (newConsortium && newConsortium.activePipelineId !== consortium.activePipelineId) {
        this.setState({
          consortium: { ...consortium, activePipelineId: newConsortium.activePipelineId },
        });
      }
    }
  }

  componentDidUpdate(prevProps) {
    const { computations } = this.props;
    const { orderedComputations } = this.state;

    if (!orderedComputations || (!prevProps.computations && computations)
      || prevProps.computations.length !== computations.length) {
      this.sortComputations();
    }
  }

  setConsortium = () => {
    const { auth: { user }, client, params } = this.props;
    const { pipeline } = this.state;
    const { owningConsortium } = pipeline;

    const owner = params.runId ? false : isPipelineOwner(user.permissions, owningConsortium);

    const data = client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
    let consortium = data.fetchAllConsortia.find(cons => cons.id === owningConsortium);

    if (consortium) {
      consortium = { ...consortium };
      delete consortium.__typename;
    }

    this.setState(prevState => ({
      owner,
      consortium,
      pipeline: { ...prevState.pipeline, owningConsortium },
      startingPipeline: { ...prevState.pipeline, owningConsortium },
    }));
  }

  setConsortiumWithActivePipeline = () => {
    const {
      auth: { user },
      params,
      pipelines,
      consortia,
    } = this.props;


    const pipeline = pipelines.find(p => p.id === params.pipelineId);

    if (!pipeline || !pipeline.owningConsortium) {
      return;
    }

    const { owningConsortium } = pipeline;

    const consortium = consortia.find(con => con.id === owningConsortium);

    if (!consortium) {
      return;
    }

    const owner = isPipelineOwner(user.permissions, owningConsortium);

    this.setState(prevState => ({
      owner,
      consortium: omit(consortium, ['__typename']),
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

        if ('covariates' in inputMap && 'value' in inputMap.covariates && inputMap.covariates.value.length) {
          let covariateMappings = [...inputMap.covariates.value];

          covariateMappings = inputMap.covariates.value
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
              value: covariateMappings,
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
          } if (key === 'covariates' && 'value' in movedStep.inputMap.covariates && movedStep.inputMap.covariates.value.length) {
            return {
              [key]: movedStep.inputMap[key].value
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

    const pipelinesData = client.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
    const data = pipelinesData.fetchAllPipelines.find(p => p.id === pipeline) || {};
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
    }));
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
      auth: { user }, notifySuccess, notifyError, saveActivePipeline, savePipeline, updateMapStatus,
    } = this.props;
    const { pipeline } = this.state;

    const { isActive } = pipeline;

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

      updateMapStatus(newPipeline.owningConsortium, newPipeline);

      notifySuccess('Pipeline Saved');

      if (isActive) {
        const { savePipeline } = data;
        await saveActivePipeline(savePipeline.owningConsortium, savePipeline.id);
      }
    } catch (error) {
      this.setState({ savingStatus: 'fail' });

      notifyError(getGraphQLErrorMessage(error, 'Failed to save pipeline'));
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

    if (!computations || !computations.length) {
      return;
    }

    const orderedComputations = computations.slice().sort((a, b) => {
      const nameA = a.meta.name.toLowerCase();
      const nameB = b.meta.name.toLowerCase();

      if (nameA < nameB) {
        return -1;
      }

      return (nameA > nameB) ? 1 : 0;
    });

    this.setState({ orderedComputations });
  }

  handleHeadlessMemberSelect = (value) => {
    this.setState({ selectedHeadlessMember: value });
  }

  addHeadlessMember = () => {
    const { selectedHeadlessMember: newHeadlessMember, pipeline } = this.state;

    const headlessMembers = pipeline.headlessMembers
      ? { ...pipeline.headlessMembers, [newHeadlessMember.value]: newHeadlessMember.label }
      : { [newHeadlessMember.value]: newHeadlessMember.label };

    this.updatePipeline({ param: 'headlessMembers', value: headlessMembers });

    this.setState({ selectedHeadlessMember: null });
  }

  removeHeadlessMember = headlessMemberId => () => {
    const { pipeline } = this.state;

    if (!(headlessMemberId in pipeline.headlessMembers)) {
      return;
    }

    const { [headlessMemberId]: removedMember, ...remainingMembers } = pipeline.headlessMembers;

    this.setState(prevState => ({
      pipeline: {
        ...prevState.pipeline,
        headlessMembers: remainingMembers,
        steps: [],
      },
    }));
  }

  getAvailableComputations = () => {
    const { availableHeadlessClients } = this.props;
    const { orderedComputations, pipeline } = this.state;

    if (!orderedComputations) {
      return [];
    }

    const { headlessMembers } = pipeline;

    if (!headlessMembers || Object.keys(headlessMembers).length === 0
      || !availableHeadlessClients) {
      return orderedComputations;
    }

    const cloudComputations = Object.keys(headlessMembers)
      .reduce((cloudComputations, headlessMemberId) => {
        const headlessClientConfig = availableHeadlessClients
          .find(client => client.id === headlessMemberId);

        if (headlessClientConfig) {
          Object.keys(headlessClientConfig.computationWhitelist).forEach((compId) => {
            cloudComputations[compId] = true;
          });
        }

        return cloudComputations;
      }, {});

    const filteredComputations = orderedComputations
      .filter(comp => comp.id in cloudComputations);

    return filteredComputations;
  }

  getVaultDescription = () => {
    const { selectedHeadlessMember } = this.state;

    if (!selectedHeadlessMember?.label) {
      return '';
    }

    const { label: vaultTitle } = selectedHeadlessMember;

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(vaultDescriptions)) {
      if (vaultTitle === key || (vaultTitle.startsWith('gen-ec2-') && vaultTitle.endsWith(key))) {
        return value;
      }
    }

    return '';
  }

  handleGoBackToConsortium = () => {
    const { consortium } = this.state;
    const { router } = this.context;

    localStorage.setItem('HIGHLIGHT_CONSORTIUM', consortium.id);
    router.push('/dashboard/consortia');
  };

  handleGoToMap = () => {
    const { consortium } = this.state;
    const { router } = this.context;

    router.push(`/dashboard/maps/${consortium.id}`);
  }

  handleToggleVaultDescriptionModal = () => {
    const { showVaultDescriptionModal } = this.state;

    this.setState({ showVaultDescriptionModal: !showVaultDescriptionModal });
  }

  render() {
    const {
      connectDropTarget,
      consortia,
      users,
      classes,
      auth,
      availableHeadlessClients,
      tutorialChange,
    } = this.props;
    const {
      consortium,
      pipeline,
      owner,
      openOwningConsortiumMenu,
      openAddComputationStepMenu,
      showModal,
      savingStatus,
      selectedHeadlessMember,
      showVaultDescriptionModal,
    } = this.state;
    const isEditing = !!pipeline.id;
    const title = isEditing ? 'Pipeline Edit' : 'Pipeline Creation';

    const headlessClientsOptions = this.mapHeadlessUsers(availableHeadlessClients, pipeline);

    const availableComputations = this.getAvailableComputations();

    const vaultDescription = this.getVaultDescription();

    return connectDropTarget(
      <div>
        <Box className="page-header" marginBottom={2}>
          <Typography variant="h4">{title}</Typography>
        </Box>
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
              id="set-active"
              control={(
                <Checkbox
                  checked={pipeline.isActive || false}
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
                checked={pipeline.limitOutputToOwner}
                disabled={!owner}
                onChange={evt => this.updatePipeline({ param: 'limitOutputToOwner', value: evt.target.checked })}
              />
            )}
            label="Only send results to consortia owner"
            className={classes.formControl}
          />
          <div className={classes.formControl}>
            <Typography variant="h6" gutterBottom>Owning Consortium</Typography>
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
                .filter(cons => isUserInGroup(auth.user.id, cons.owners))
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
          <Box textAlign="right" className={classes.buttonWrapper}>
            {consortium && consortium.activePipelineId
              && consortium.activePipelineId === pipeline.id
              && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleGoToMap}
                >
                  Map Local Data
                </Button>
              )}
            {consortium && (
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleGoBackToConsortium}
              >
                Go to Consortium
              </Button>
            )}
            <StatusButtonWrapper status={savingStatus}>
              <Button
                id="save-pipeline"
                key="save-pipeline-button"
                variant="contained"
                color="primary"
                disabled={!owner || !consortium || savingStatus === 'pending'}
                type="submit"
              >
                Save Pipeline
              </Button>
            </StatusButtonWrapper>
          </Box>
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
          {
            availableHeadlessClients && (
              <div>
                <Box display="flex" alignItems="center">
                  <Typography variant="h6" className={classes.vaultUserTitle}>Vault Users:</Typography>
                  <Tooltip
                    title={
                      <Typography variant="body1">{VAULT_USERS_TOOLTIP}</Typography>
                    }
                  >
                    <InfoIcon />
                  </Tooltip>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" gridColumnGap={8}>
                  <Select
                    value={selectedHeadlessMember}
                    placeholder="Select an user"
                    options={headlessClientsOptions}
                    onChange={this.handleHeadlessMemberSelect}
                    removeSelected
                    name="members-input"
                  />
                  {vaultDescription && (
                    <IconButton onClick={this.handleToggleVaultDescriptionModal}>
                      <HelpOutlineIcon />
                    </IconButton>
                  )}
                  <Button
                    className={classes.addMemberButton}
                    variant="contained"
                    color="secondary"
                    disabled={!selectedHeadlessMember}
                    onClick={this.addHeadlessMember}
                  >
                    Add Vault User
                  </Button>
                </Box>
                <Grid container>
                  <Grid item xs={12} md={6} lg={3}>
                    <List>
                      {
                        pipeline.headlessMembers
                        && Object.keys(pipeline.headlessMembers).map(headlessUserId => (
                          <ListItem key={headlessUserId}>
                            <ListItemText primary={pipeline.headlessMembers[headlessUserId]} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={this.removeHeadlessMember(headlessUserId)}>
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))
                      }
                    </List>
                  </Grid>
                </Grid>
              </div>
            )
          }
          <Paper className={classes.tooltipPaper}>
            <Typography className={classes.tooltip} variant="body2">
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
              {availableComputations && availableComputations.map(comp => (
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
                headlessMembers={pipeline.headlessMembers}
                headlessClientsConfig={availableHeadlessClients}
                isEdit={!!pipeline.id}
              />
            ))}
          </div>
          {!pipeline.steps.length && (
            <Typography variant="body2">
              No computations added
            </Typography>
          )}
        </ValidatorForm>
        {!auth.isTutorialHidden && (
          <Joyride
            steps={STEPS.pipeline}
            continuous
            disableScrollParentFix
            callback={tutorialChange}
          />
        )}
        <Dialog
          open={showVaultDescriptionModal}
          onClose={this.handleToggleVaultDescriptionModal}
        >
          <DialogTitle>{selectedHeadlessMember?.label}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {vaultDescription}
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

Pipeline.contextTypes = {
  router: PropTypes.object.isRequired,
};

Pipeline.defaultProps = {
  activePipeline: null,
  runs: null,
  users: [],
  subscribeToComputations: null,
  subscribeToPipelines: null,
  availableHeadlessClients: [],
};

Pipeline.propTypes = {
  activePipeline: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  computations: PropTypes.array.isRequired,
  consortia: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  runs: PropTypes.array,
  users: PropTypes.array,
  availableHeadlessClients: PropTypes.array,
  connectDropTarget: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  savePipeline: PropTypes.func.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
  tutorialChange: PropTypes.func.isRequired,
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
  )),
  graphql(FETCH_ALL_HEADLESS_CLIENTS, {
    props: ({ data: { fetchAllHeadlessClients } }) => ({
      availableHeadlessClients: fetchAllHeadlessClients,
    }),
  })
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
  updateMapStatus,
  tutorialChange,
})(PipelineWithAlert);

export default withStyles(styles)(connectedComponent);
