import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { compose, graphql, withApollo } from 'react-apollo';
import { ipcRenderer } from 'electron';
import classNames from 'classnames';
import { orderBy } from 'lodash';
import {
  Button, Menu, MenuItem, TextField, Typography,
} from '@material-ui/core';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import MemberAvatar from '../common/member-avatar';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import { deleteAllDataMappingsFromConsortium } from '../../state/ducks/maps';
import { pullComputations } from '../../state/ducks/docker';
import {
  CREATE_RUN_MUTATION,
  DELETE_CONSORTIUM_MUTATION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
  SAVE_ACTIVE_PIPELINE_MUTATION,
} from '../../state/graphql/functions';
import {
  consortiaMembershipProp,
  removeDocFromTableProp,
  saveDocumentProp,
  consortiumSaveActivePipelineProp,
} from '../../state/graphql/props';
import { notifyInfo, notifyError } from '../../state/ducks/notifyAndLog';
import { start, finish } from '../../state/ducks/loading';
import { pipelineNeedsDataMapping } from '../../../main/utils/run-pipeline-functions';

const MAX_LENGTH_CONSORTIA = 50;

const styles = theme => ({
  button: {
    margin: theme.spacing(1),
  },
  contentContainer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
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
});

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class ConsortiaList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      consortiumToDelete: -1,
      showModal: false,
      isConsortiumPipelinesMenuOpen: false,
      search: '',
      consortiumJoinedByThread:
        localStorage.getItem('CONSORTIUM_JOINED_BY_THREAD'),
    };

    localStorage.removeItem('CONSORTIUM_JOINED_BY_THREAD');

    this.deleteConsortium = this.deleteConsortium.bind(this);
    this.joinConsortium = this.joinConsortium.bind(this);
    this.leaveConsortium = this.leaveConsortium.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.selectPipeline = this.selectPipeline.bind(this);
    this.startPipeline = this.startPipeline.bind(this);
    this.stopPipeline = this.stopPipeline.bind(this);
  }

  componentDidMount() {
    const { consortiumJoinedByThread } = this.state;

    if (consortiumJoinedByThread) {
      setTimeout(() => {
        this.setState({ consortiumJoinedByThread: null });
      }, 5000);
    }
  }

  getConsortiumPipelines = (consortium) => {
    const { pipelines } = this.props;
    return pipelines.filter(pipe => pipe.owningConsortium === consortium.id);
  }

  getOptions(member, owner, consortium) {
    const {
      maps,
      classes,
      pipelines,
      runs,
    } = this.props;
    const { isConsortiumPipelinesMenuOpen } = this.state;

    const actions = [];
    const text = [];

    const pipeline = pipelines.find(pipe => pipe.id === consortium.activePipelineId);

    const consortiumHasDataMap = maps.findIndex(m => m.consortiumId === consortium.id
      && m.pipelineId === consortium.activePipelineId) > -1;

    const needsDataMapping = !consortiumHasDataMap && pipelineNeedsDataMapping(pipeline);

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
          {consortium.activePipelineId
            ? pipeline.name
            : 'None'
          }
        </Typography>
      </div>
    );

    // Add owner/member list
    const ownersIds = consortium.owners.reduce((acc, user) => {
      acc[user] = true;
      return acc;
    }, {});

    const consortiumUsers = consortium.owners
      .map(user => ({ id: user, owner: true, member: true }))
      .concat(
        consortium.members
          .filter(user => !Object.prototype.hasOwnProperty.call(ownersIds, user))
          .map(user => ({ id: user, member: true }))
      );

    const avatars = consortiumUsers
      .filter((v, i, a) => i === a.indexOf(v))
      .map(user => (
        <MemberAvatar
          key={`${user.id}-avatar`}
          consRole={user.owner ? 'Owner' : 'Member'}
          name={user.id}
          showDetails
          width={40}
          mapped={
            consortium.mappedForRun
              && consortium.mappedForRun.indexOf(user.id) !== -1
          }
        />
      ));

    text.push(
      <div key="avatar-container" className={classes.contentContainer}>
        <Typography className={classes.label}>
          Owner(s)/Members:
        </Typography>
        {avatars}
      </div>
    );

    if (owner && consortium.activePipelineId && !needsDataMapping) {
      const isPipelineRunning = runs.filter((run) => {
        return run.consortiumId === consortium.id && run.status === 'started';
      }).length > 0;

      actions.push(
        <Button
          key={`${consortium.id}-start-pipeline-button`}
          variant="contained"
          className={classes.button}
          onClick={this.startPipeline(consortium.id)}
        >
          Start Pipeline
        </Button>
      );

      if (isPipelineRunning) {
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

    if (member && !owner) {
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
    } else if (!member && !owner && consortium.activePipelineId) {
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
        owner={isUserA(user.id, consortium.owners)}
        highlight={consortiumJoinedByThread === consortium.id}
        itemOptions={
          this.getOptions(
            isUserA(user.id, consortium.members),
            isUserA(user.id, consortium.owners),
            consortium
          )
        }
        itemRoute="/dashboard/consortia"
      />
    );
  }

  handleSearchChange = (evt) => {
    this.setState({ search: evt.target.value });
  }

  getFilteredConsortia = () => {
    const { consortia } = this.props;
    const { search } = this.state;

    if (!search) {
      return consortia;
    }

    return consortia.filter(
      consortium => consortium.name.toLowerCase().indexOf(search.toLowerCase()) !== -1
    );
  }

  getConsortiaByOwner = () => {
    const { auth } = this.props;

    const consortia = this.getFilteredConsortia();

    const memberConsortia = [];
    const otherConsortia = [];

    if (consortia && consortia.length <= MAX_LENGTH_CONSORTIA) {
      consortia.forEach((consortium) => {
        const { owners, members } = consortium;
        if ([...owners, ...members].indexOf(auth.user.id) !== -1) {
          memberConsortia.push(consortium);
        } else {
          otherConsortia.push(consortium);
        }
      });
    }

    return {
      memberConsortia: orderBy(memberConsortia, ['createDate'], ['desc']),
      otherConsortia: orderBy(otherConsortia, ['createDate'], ['desc']),
    };
  }

  startPipeline(consortiumId) {
    return async () => {
      const {
        createRun, startLoading, finishLoading, notifyError,
      } = this.props;

      startLoading('start-pipeline');
      try {
        await createRun(consortiumId);
      } catch (_) {
        notifyError('An error has occurred on the pipeline initialization. Please try again later.');
      } finally {
        finishLoading('start-pipeline');
      }
    };
  }

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
    const { deleteAllDataMappingsFromConsortium, leaveConsortium } = this.props;

    await deleteAllDataMappingsFromConsortium(consortiumId);
    leaveConsortium(consortiumId);
  }

  joinConsortium(consortiumId, activePipelineId) {
    const {
      client, pipelines, pullComputations, notifyInfo, joinConsortium,
    } = this.props;

    if (activePipelineId) {
      const computationData = client.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });
      const pipeline = pipelines.find(cons => cons.id === activePipelineId);

      const computations = [];
      pipeline.steps.forEach((step) => {
        const compObject = computationData.fetchAllComputations
          .find(comp => comp.id === step.computations[0].id);
        computations.push({
          img: compObject.computation.dockerImage,
          compId: compObject.id,
          compName: compObject.meta.name,
        });
      });

      pullComputations({ consortiumId, computations });
      notifyInfo('Pipeline computations downloading via Docker.');
    }

    joinConsortium(consortiumId);
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

  render() {
    const { consortia, classes } = this.props;
    const { search, showModal } = this.state;
    const { memberConsortia, otherConsortia } = this.getConsortiaByOwner();

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Consortia
          </Typography>
          <Fab
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
          value={search}
          className={classes.searchInput}
          onChange={this.handleSearchChange}
        />

        {consortia && consortia.length && consortia.length > MAX_LENGTH_CONSORTIA
          && consortia.map(this.renderListItem)}

        {memberConsortia.length > 0 && (
          <Typography variant="h6">Your Consortia</Typography>
        )}

        {memberConsortia.length > 0
          && memberConsortia.map(this.renderListItem)
        }

        {otherConsortia.length > 0 && (
          <Typography variant="h6" className={classes.subtitle}>Other Consortia</Typography>
        )}

        {otherConsortia.length > 0
          && otherConsortia.map(this.renderListItem)}

        {(!consortia || !consortia.length) && (
          <Typography variant="body2">
            No consortia found
          </Typography>
        )}
        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.deleteConsortium}
          itemName="consortium"
          show={showModal}
          warningMessage="All pipelines associated with this consortium will also be deleted"
        />
      </div>
    );
  }
}

ConsortiaList.propTypes = {
  auth: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  maps: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  router: PropTypes.object.isRequired,
  runs: PropTypes.array.isRequired,
  createRun: PropTypes.func.isRequired,
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
};

const mapStateToProps = ({ auth, maps }) => ({
  auth,
  maps: maps.consortiumDataMappings,
});

const ConsortiaListWithData = compose(
  graphql(CREATE_RUN_MUTATION, saveDocumentProp('createRun', 'consortiumId')),
  graphql(DELETE_CONSORTIUM_MUTATION, removeDocFromTableProp(
    'consortiumId',
    'deleteConsortiumById',
    FETCH_ALL_CONSORTIA_QUERY,
    'fetchAllConsortia'
  )),
  graphql(JOIN_CONSORTIUM_MUTATION, consortiaMembershipProp('joinConsortium')),
  graphql(LEAVE_CONSORTIUM_MUTATION, consortiaMembershipProp('leaveConsortium')),
  graphql(SAVE_ACTIVE_PIPELINE_MUTATION, consortiumSaveActivePipelineProp('saveActivePipeline')),
  withApollo
)(ConsortiaList);

export default withStyles(styles)(
  connect(mapStateToProps,
    {
      notifyInfo,
      notifyError,
      pullComputations,
      deleteAllDataMappingsFromConsortium,
      startLoading: start,
      finishLoading: finish,
    })(ConsortiaListWithData)
);
