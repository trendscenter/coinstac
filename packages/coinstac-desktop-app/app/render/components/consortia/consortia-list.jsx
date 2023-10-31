import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Joyride from 'react-joyride';
import { graphql, withApollo } from '@apollo/react-hoc';
import { ipcRenderer } from 'electron';
import classNames from 'classnames';
import {
  get, orderBy, flowRight as compose, debounce,
} from 'lodash';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Pagination from '@material-ui/lab/Pagination';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import { v4 as uuid } from 'uuid';

import MemberAvatar from '../common/member-avatar';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import { tutorialChange } from '../../state/ducks/auth';
import { deleteAllDataMappingsFromConsortium } from '../../state/ducks/maps';
import { pullComputations } from '../../state/ducks/docker';
import {
  CREATE_RUN_MUTATION,
  DELETE_CONSORTIUM_MUTATION,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
  SAVE_ACTIVE_PIPELINE_MUTATION,
  FETCH_USERS_ONLINE_STATUS,
  USERS_ONLINE_STATUS_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import {
  consortiaMembershipProp,
  removeDocFromTableProp,
  saveDocumentProp,
  consortiumSaveActivePipelineProp,
} from '../../state/graphql/props';
import { notifyInfo, notifyError, notifyWarning } from '../../state/ducks/notifyAndLog';
import { start, finish } from '../../state/ducks/loading';
import { startRun } from '../../state/ducks/runs';
import { isUserInGroup, isUserOnlyOwner, pipelineNeedsDataMapping } from '../../utils/helpers';
import STEPS from '../../constants/tutorial';
import ErrorDialog from '../common/error-dialog';

const PAGE_SIZE = 10;

const styles = theme => ({
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  buttonDisabled: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
    color: theme.palette.grey[400],
    boxShadow: 'none',
    pointerEvents: 'auto !important',
    '&:hover': {
      boxShadow: 'none',
      backgroundColor: theme.palette.grey[300],
      color: theme.palette.grey[400],
    },
  },
  contentContainer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  usersContainer: {
    overflowX: 'auto',
  },
  subtitle: {
    marginTop: theme.spacing(2),
  },
  label: {
    fontWeight: 'bold',
  },
  labelInline: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
    display: 'inline-block',
  },
  value: {
    display: 'inline-block',
  },
  green: {
    color: 'green',
  },
  red: {
    color: 'red',
  },
  searchInput: {
    marginBottom: theme.spacing(4),
  },
  tabs: {
    marginBottom: theme.spacing(2),
  },
  pagination: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

class ConsortiaList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      consortiumToDelete: -1,
      showModal: false,
      showErrorDialog: false,
      isConsortiumPipelinesMenuOpen: false,
      search: '',
      consortiumJoinedByThread:
        localStorage.getItem('CONSORTIUM_JOINED_BY_THREAD'),
      highlightedConsortium:
        localStorage.getItem('HIGHLIGHT_CONSORTIUM'),
      activeTab: 'mine',
      page: 1,
    };

    localStorage.removeItem('CONSORTIUM_JOINED_BY_THREAD');
    localStorage.removeItem('HIGHLIGHT_CONSORTIUM');

    this.deleteConsortium = this.deleteConsortium.bind(this);
    this.joinConsortium = this.joinConsortium.bind(this);
    this.leaveConsortium = this.leaveConsortium.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.selectPipeline = this.selectPipeline.bind(this);
    this.startPipeline = this.startPipeline.bind(this);
    this.stopPipeline = this.stopPipeline.bind(this);
    this.closeErrorDialog = this.closeErrorDialog.bind(this);
  }

  componentDidMount() {
    const { subscribeToUsersOnlineStatus } = this.props;

    const { consortiumJoinedByThread, highlightedConsortium } = this.state;

    if (consortiumJoinedByThread) {
      setTimeout(() => {
        this.setState({ consortiumJoinedByThread: null });
      }, 5000);
    }

    if (highlightedConsortium) {
      const elem = document.getElementById(highlightedConsortium);
      if (elem) {
        elem.scrollIntoView({ block: 'center' });
      }
    }

    subscribeToUsersOnlineStatus();
  }

  getFilteredConsortia = () => {
    const { consortia } = this.props;
    const { search } = this.state;

    if (!search) {
      return consortia || [];
    }

    const searchLowerCase = search.toLowerCase();

    return (consortia || []).filter(consortium =>
      // eslint-disable-next-line
      consortium.name.toLowerCase().includes(searchLowerCase)
      || consortium.description.toLowerCase().includes(searchLowerCase));
  }

  getConsortiaByActiveTab = () => {
    const { auth: { user } } = this.props;
    const { activeTab } = this.state;

    const filteredConsortia = this.getFilteredConsortia();

    const consortia = filteredConsortia.filter((consortium) => {
      const { owners, members } = consortium;

      if (activeTab === 'mine') {
        return user.id in owners || user.id in members;
      }

      if (activeTab === 'other') {
        return !(user.id in owners || user.id in members);
      }

      return false;
    });

    return orderBy(consortia, ['createDate'], ['desc']);
  }

  getPaginatedConsortia = () => {
    const { page } = this.state;

    const consortia = this.getConsortiaByActiveTab();
    const consortiaToShow = consortia.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return consortiaToShow;
  }

  getConsortiumPipelines = (consortium) => {
    const { pipelines } = this.props;
    return pipelines.filter(pipe => pipe.owningConsortium === consortium.id);
  }

  getOptions(member, owner, onlyOwner, consortium) {
    const {
      auth,
      maps,
      classes,
      pipelines,
      runs,
      usersOnlineStatus,
      dockerStatus,
    } = this.props;
    const { isConsortiumPipelinesMenuOpen } = this.state;

    const actions = [];
    const text = [];

    const pipeline = pipelines.find(pipe => pipe.id === consortium.activePipelineId);

    const isPipelineDecentralized = pipeline ? pipeline.steps.findIndex(step => step.controller.type === 'decentralized') > -1 : false;

    const dataMapIsComplete = maps.findIndex(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId && m.isComplete) > -1;

    const needsDataMapping = !dataMapIsComplete
      && pipelineNeedsDataMapping(pipeline)
      && auth.user.id in consortium.activeMembers;

    // Add pipeline text
    text.push(
      <div key={`${consortium.id}-active-pipeline-text`} className={classes.contentContainer}>
        <Typography className={classes.labelInline}>
          Active Pipeline:
        </Typography>
        <Typography className={
          classNames(classes.value, consortium.activePipelineId ? classes.green : classes.red)
        }
        >
          {pipeline?.name || 'None'}
        </Typography>
      </div>
    );

    const consortiumUsers = Object.keys(consortium.owners)
      .map(userId => ({
        id: userId, name: consortium.owners[userId], owner: true, member: true,
      }))
      .concat(
        Object.keys(consortium.members)
          .filter(userId => !(userId in consortium.owners))
          .map(userId => ({
            id: userId, name: consortium.members[userId], owner: false, member: true,
          }))
      );

    const avatars = consortiumUsers
      .filter((v, i, a) => i === a.indexOf(v))
      .map(user => (
        <MemberAvatar
          id={user.id}
          key={`${user.id}-avatar`}
          consRole={user.owner ? 'Owner' : 'Member'}
          name={user.name}
          showDetails
          width={40}
          ready={
            usersOnlineStatus[user.id] && pipeline
            && ((consortium.mappedForRun && consortium.mappedForRun.indexOf(user.id) > -1)) // eslint-disable-line max-len
          }
        />
      ));

    text.push(
      <Grid key="avatar-wrapper" container spacing={2}>
        <Grid item xs={6} className={classes.usersContainer}>
          <Typography className={classes.label}>
            Owner(s)/Members:
          </Typography>
          {avatars}
        </Grid>
        <Grid item xs={6} className={classes.usersContainer}>
          <Typography className={classes.label}>
            Active Members:
          </Typography>
          <Typography variant="body1">
            {Object.keys(consortium.activeMembers)
              .map(memberId => consortium.activeMembers[memberId])
              .join(', ')}
          </Typography>
        </Grid>
      </Grid>
    );

    if ((owner || member) && consortium.activePipelineId && !needsDataMapping) {
      const isPipelineRunning = runs.filter((run) => {
        return run.consortiumId === consortium.id && run.status === 'started';
      }).length > 0;

      if ((owner && isPipelineDecentralized && Object.keys(consortium.activeMembers).length > 0)
        || (!isPipelineDecentralized && auth.user.id in consortium.activeMembers)) {
        if (auth.user.id in consortium.activeMembers
          && !auth.containerService === 'singularity'
          && !dockerStatus) {
          actions.push(
            <Tooltip title="Docker is not running" placement="top">
              <Button
                key={`${consortium.id}-start-pipeline-button`}
                variant="contained"
                className={classes.buttonDisabled}
              >
                Start Pipeline
              </Button>
            </Tooltip>
          );
        } else {
          actions.push(
            <Button
              key={`${consortium.id}-start-pipeline-button`}
              variant="contained"
              className={`${classes.button} start-pipeline`}
              onClick={() => this.debouncedStartPipeline(consortium)}
            >
              Start Pipeline
            </Button>
          );
        }
      }

      if (isPipelineRunning && owner) {
        actions.push(
          <Button
            key={`${consortium.id}-stop-pipeline-button`}
            variant="contained"
            className={classes.button}
            onClick={this.stopPipeline(consortium.activePipelineId)}
          >
            Stop Pipeline
          </Button>
        );
      }
    } else if (owner && !consortium.activePipelineId) {
      const consortiumPipelines = this.getConsortiumPipelines(consortium);

      actions.push(
        <Fragment key={`${consortium.id}-set-active-pipeline-button`}>
          <Button
            component={Link}
            variant="contained"
            color="secondary"
            className={classes.button}
            onClick={event => this.handleSetActivePipelineOnConsortium(
              event, consortium, consortiumPipelines.length === 0
            )}
          >
            Set Active Pipeline
          </Button>
          <Menu
            id="consortium-pipelines-dropdown-menu"
            anchorEl={this.pipelinesButtonElement}
            open={isConsortiumPipelinesMenuOpen === consortium.id}
            onClose={() => this.closeConsortiumPipelinesMenu()}
          >
            {
              consortiumPipelines
              && consortiumPipelines.map(pipe => (
                <MenuItem
                  key={`owned-${pipe.id}`}
                  onClick={() => this.selectPipeline(consortium.id, pipe.id)}
                >
                  {pipe.name}
                </MenuItem>
              ))
            }
          </Menu>
        </Fragment>
      );
    } else if (owner && consortium.activePipelineId) {
      actions.push(
        <Button
          key={`${consortium.id}-unset-active-pipeline-button`}
          component={Link}
          variant="contained"
          color="secondary"
          className={classes.button}
          onClick={event => this.handleUnsetActivePipelineOnConsortium(
            event, consortium
          )}
        >
          Unset Active Pipeline
        </Button>
      );
    } else if ((owner || member) && needsDataMapping) {
      actions.push(
        <Button
          key={`${consortium.id}-set-map-local-button`}
          component={Link}
          to={`/dashboard/maps/${consortium.id}`}
          variant="contained"
          color="secondary"
          className={classes.button}
        >
          Map Local Data
        </Button>
      );
    }

    if (owner) {
      actions.push(
        <Button
          key={`${consortium.id}-set-active-members-button`}
          variant="contained"
          color="default"
          className={classes.button}
          component={Link}
          to={`dashboard/consortia/${consortium.id}/2`}
        >
          Set Active Members
        </Button>
      );
    }

    if ((owner && !onlyOwner) || (!owner && member)) {
      actions.push(
        <Button
          key={`${consortium.id}-leave-cons-button`}
          name={`${consortium.name}-leave-cons-button`}
          variant="contained"
          color="secondary"
          className={classes.button}
          onClick={() => this.leaveConsortium(consortium.id)}
        >
          Leave Consortium
        </Button>
      );
    }

    if (!member && !owner) {
      actions.push(
        <Button
          key={`${consortium.id}-join-cons-button`}
          name={`${consortium.name}-join-cons-button`}
          variant="contained"
          color="secondary"
          className={classes.button}
          onClick={() => this.joinConsortium(consortium.id, consortium.activePipelineId)}
        >
          Join Consortium
        </Button>
      );
    }

    return { actions, text, owner };
  }

  handleSetActivePipelineOnConsortium = (event, consortium, redirect) => {
    const { router } = this.props;

    if (redirect) {
      router.push(`dashboard/consortia/${consortium.id}/1`);
    } else {
      this.openConsortiumPipelinesMenu(event, consortium.id);
    }
  }

  handleUnsetActivePipelineOnConsortium = (event, consortium) => {
    const { saveActivePipeline } = this.props;
    saveActivePipeline(consortium.id, null);
  }

  closeConsortiumPipelinesMenu = () => {
    this.setState({ isConsortiumPipelinesMenuOpen: false });
  }

  openConsortiumPipelinesMenu = (event, consortiumId) => {
    this.pipelinesButtonElement = event.target;
    this.setState({ isConsortiumPipelinesMenuOpen: consortiumId });
  }

  renderListItem = (consortium) => {
    const { auth } = this.props;
    const { consortiumJoinedByThread } = this.state;

    const { user } = auth;

    return (
      <ListItem
        key={`${consortium.id}-list-item`}
        itemObject={consortium}
        deleteItem={this.openModal}
        owner={isUserInGroup(user.id, consortium.owners)}
        highlight={consortiumJoinedByThread === consortium.id}
        itemOptions={
          this.getOptions(
            isUserInGroup(user.id, consortium.members),
            isUserInGroup(user.id, consortium.owners),
            isUserOnlyOwner(user.id, consortium.owners),
            consortium
          )
        }
        itemRoute="/dashboard/consortia"
        hideDetailButton={!isUserInGroup(user.id, consortium.owners)}
      />
    );
  }

  handleSearchChange = (evt) => {
    this.debouncedSearchChange(evt.target.value);
  }

  // eslint-disable-next-line
  debouncedSearchChange = debounce(search => this.setState({ search }), 500)

  handlePageChange = (_, value) => {
    this.setState({ page: value });
  }

  suspendPipeline = consortiumId => () => {
    const { runs } = this.props;

    const presentRun = runs
      .filter(run => run.consortiumId === consortiumId)
      .reduce((prev, curr) => {
        return prev.startDate > curr.startDate ? prev : curr;
      });

    if (presentRun) {
      ipcRenderer.send('suspend-pipeline', { runId: presentRun.id });
    }
  }

  handleChangeTab = (_, activeTab) => {
    this.setState({ activeTab });
  }

  startPipeline = async (consortium) => {
    const {
      pipelines, saveRemoteDecentralizedRun, startRun, startLoading, finishLoading,
      notifyWarning, notifyError, auth,
    } = this.props;

    const pipeline = pipelines.find(pipe => pipe.id === consortium.activePipelineId);

    if (!pipeline.steps) {
      return notifyWarning('The selected pipeline has no steps');
    }

    const isPipelineDecentralized = pipeline.steps.findIndex(step => step.controller.type === 'decentralized') > -1;

    try {
      startLoading('start-pipeline');

      if (isPipelineDecentralized) {
        return await saveRemoteDecentralizedRun(consortium.id);
      }

      const localRun = {
        id: uuid(),
        clients: {
          [auth.user.id]: auth.user.username,
        },
        observers: {
          [auth.user.id]: auth.user.username,
        },
        consortiumId: consortium.id,
        pipelineSnapshot: pipeline,
        startDate: Date.now(),
        type: 'local',
        status: 'started',
      };

      startRun(localRun, consortium);
    } catch ({ graphQLErrors }) {
      const errorCode = get(graphQLErrors, '0.extensions.exception.data.errorCode', '');
      const errorMessage = get(graphQLErrors, '0.message', 'Failed to start pipeline');

      if (errorCode === 'VAULT_OFFLINE') {
        this.setState({ showErrorDialog: true, errorMessage, errorTitle: 'Vault offline' });
      } else {
        notifyError(errorMessage);
      }
    } finally {
      finishLoading('start-pipeline');
    }
  }

  debouncedStartPipeline = debounce(consortium => this.startPipeline(consortium), 5000)

  stopPipeline(pipelineId) {
    return () => {
      const { runs } = this.props;

      const presentRun = runs.reduce((prev, curr) => {
        return prev.startDate > curr.startDate ? prev : curr;
      });
      const runId = presentRun.id;

      ipcRenderer.send('stop-pipeline', { pipelineId, runId });
    };
  }

  async leaveConsortium(consortiumId) {
    const {
      client, deleteAllDataMappingsFromConsortium, leaveConsortium, notifyError,
    } = this.props;

    await deleteAllDataMappingsFromConsortium(consortiumId);

    try {
      await leaveConsortium(consortiumId);
    } catch (error) {
      notifyError(get(error, 'message', 'Failed to start pipeline'));
    }

    return client.refetchQueries({
      include: [FETCH_ALL_PIPELINES_QUERY],
    });
  }

  async joinConsortium(consortiumId, activePipelineId) {
    const {
      client,
      pullComputations,
      notifyInfo,
      notifyError,
      joinConsortium,
      dockerStatus,
    } = this.props;

    joinConsortium(consortiumId);

    if (!activePipelineId) return;

    const [{ data }] = await client.refetchQueries({
      include: [FETCH_ALL_PIPELINES_QUERY],
    });

    const pipelines = get(data, 'fetchAllPipelines', []);

    const activePipeline = pipelines.find(pipe => pipe.id === activePipelineId);

    if (!activePipeline) {
      return notifyError('Couldn\'t find the active pipeline for this consortium');
    }

    const computationData = client.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });

    const computations = [];
    activePipeline.steps.forEach((step) => {
      const compObject = computationData.fetchAllComputations
        .find(comp => comp.id === step.computations[0].id);
      computations.push({
        img: compObject.computation.dockerImage,
        compId: compObject.id,
        compName: compObject.meta.name,
      });
    });

    if (dockerStatus) {
      pullComputations({ consortiumId, computations });
      notifyInfo('Pipeline computations downloading via Docker.');
    }
  }

  async deleteConsortium() {
    const { deleteAllDataMappingsFromConsortium, deleteConsortiumById, consortia } = this.props;
    const { consortiumToDelete } = this.state;

    const consortium = consortia.find(c => c.id === consortiumToDelete);

    await deleteAllDataMappingsFromConsortium(consortium.id);

    deleteConsortiumById(consortium.id);

    this.closeModal();
  }

  openModal(consortiumId) {
    return () => {
      this.setState({
        showModal: true,
        consortiumToDelete: consortiumId,
      });
    };
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  async selectPipeline(consortiumId, pipelineId) {
    const { deleteAllDataMappingsFromConsortium, saveActivePipeline } = this.props;
    await deleteAllDataMappingsFromConsortium(consortiumId);

    saveActivePipeline(consortiumId, pipelineId);
    this.closeConsortiumPipelinesMenu();
  }

  closeErrorDialog() {
    this.setState({ showErrorDialog: false });
  }

  renderPagiation = () => {
    const { classes } = this.props;
    const { page } = this.state;
    const consortia = this.getConsortiaByActiveTab();

    const totalPages = Math.ceil(consortia.length / PAGE_SIZE);

    if (consortia.length === 0 || totalPages <= 1) {
      return null;
    }

    return (
      <div className={classes.pagination}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={this.handlePageChange}
        />
      </div>
    );
  }

  render() {
    const {
      classes,
      auth,
      tutorialChange,
    } = this.props;
    const {
      // search,
      showModal,
      showErrorDialog,
      errorMessage,
      errorTitle,
      activeTab,
    } = this.state;

    const consortia = this.getPaginatedConsortia();

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Consortia
          </Typography>
          <Fab
            id="consortium-add"
            color="primary"
            component={Link}
            to="/dashboard/consortia/new"
            className={classes.button}
            name="create-consortium-button"
            aria-label="add"
          >
            <AddIcon />
          </Fab>
        </div>

        <TextField
          id="search"
          label="Search"
          fullWidth
          // value={search}
          defaultValue=""
          className={classes.searchInput}
          onChange={this.handleSearchChange}
        />

        <Tabs
          value={activeTab}
          onChange={this.handleChangeTab}
          className={classes.tabs}
        >
          <Tab label="My Consortia" value="mine" />
          <Tab label="Other Consortia" value="other" />
        </Tabs>

        {this.renderPagiation()}

        {consortia.length > 0 ? (
          consortia.map(this.renderListItem)
        ) : (
          <Typography variant="body2">
            No consortia found
          </Typography>
        )}

        {this.renderPagiation()}

        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.deleteConsortium}
          itemName="consortium"
          show={showModal}
          warningMessage="All pipelines associated with this consortium will also be deleted"
        />
        <ErrorDialog
          handleClose={this.closeErrorDialog}
          open={showErrorDialog}
          title={errorTitle}
          message={errorMessage}
        />
        {!auth.isTutorialHidden && (
          <Joyride
            steps={STEPS.consortiaList}
            disableScrollParentFix
            callback={tutorialChange}
          />
        )}
      </div>
    );
  }
}

ConsortiaList.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  dockerStatus: PropTypes.bool,
  maps: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  router: PropTypes.object.isRequired,
  runs: PropTypes.array.isRequired,
  saveRemoteDecentralizedRun: PropTypes.func.isRequired,
  usersOnlineStatus: PropTypes.object,
  deleteAllDataMappingsFromConsortium: PropTypes.func.isRequired,
  saveActivePipeline: PropTypes.func.isRequired,
  deleteConsortiumById: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  pullComputations: PropTypes.func.isRequired,
  startLoading: PropTypes.func.isRequired,
  finishLoading: PropTypes.func.isRequired,
  subscribeToUsersOnlineStatus: PropTypes.func.isRequired,
  tutorialChange: PropTypes.func.isRequired,
};

ConsortiaList.defaultProps = {
  usersOnlineStatus: {},
  dockerStatus: false,
};

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

const ConsortiaListWithData = compose(
  graphql(CREATE_RUN_MUTATION, saveDocumentProp('saveRemoteDecentralizedRun', 'consortiumId')),
  graphql(DELETE_CONSORTIUM_MUTATION, removeDocFromTableProp(
    'consortiumId',
    'deleteConsortiumById',
    FETCH_ALL_CONSORTIA_QUERY,
    'fetchAllConsortia'
  )),
  graphql(JOIN_CONSORTIUM_MUTATION, consortiaMembershipProp('joinConsortium')),
  graphql(LEAVE_CONSORTIUM_MUTATION, consortiaMembershipProp('leaveConsortium')),
  graphql(SAVE_ACTIVE_PIPELINE_MUTATION, consortiumSaveActivePipelineProp('saveActivePipeline')),
  graphql(FETCH_USERS_ONLINE_STATUS, {
    props: props => ({
      usersOnlineStatus: props.data.fetchUsersOnlineStatus,
      subscribeToUsersOnlineStatus: () => props.data.subscribeToMore({
        document: USERS_ONLINE_STATUS_CHANGED_SUBSCRIPTION,
        updateQuery: (_, { subscriptionData: { data } }) => {
          return { fetchUsersOnlineStatus: data.usersOnlineStatusChanged };
        },
      }),
    }),
  }),
  withApollo
)(ConsortiaList);

export default withStyles(styles)(
  connect(mapStateToProps,
    {
      notifyInfo,
      notifyWarning,
      notifyError,
      pullComputations,
      deleteAllDataMappingsFromConsortium,
      startRun,
      tutorialChange,
      startLoading: start,
      finishLoading: finish,
    })(ConsortiaListWithData)
);
