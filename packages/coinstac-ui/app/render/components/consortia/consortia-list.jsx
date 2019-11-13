import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { compose, graphql, withApollo } from 'react-apollo';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import { ipcRenderer } from 'electron';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import MemberAvatar from '../common/member-avatar';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';
import {
  getAllAssociatedConsortia,
  incrementRunCount,
  removeCollectionsFromAssociatedConsortia,
  saveAssociatedConsortia,
  mapConsortiumData,
} from '../../state/ducks/collections';
import { saveLocalRun } from '../../state/ducks/runs';
import { updateUserPerms } from '../../state/ducks/auth';
import { pullComputations } from '../../state/ducks/docker';
import {
  CREATE_RUN_MUTATION,
  DELETE_CONSORTIUM_MUTATION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  JOIN_CONSORTIUM_MUTATION,
  LEAVE_CONSORTIUM_MUTATION,
} from '../../state/graphql/functions';
import {
  consortiaMembershipProp,
  removeDocFromTableProp,
  saveDocumentProp,
} from '../../state/graphql/props';
import { notifyInfo, notifyWarning } from '../../state/ducks/notifyAndLog';

const MAX_LENGTH_CONSORTIA = 50;

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  contentContainer: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  subtitle: {
    marginTop: theme.spacing.unit * 2,
  },
  label: {
    fontWeight: 'bold',
  },
  labelInline: {
    fontWeight: 'bold',
    marginRight: theme.spacing.unit,
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
});

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class ConsortiaList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      memberConsortia: [],
      otherConsortia: [],
      consortiumToDelete: -1,
      showModal: false,
    };

    this.props.getAllAssociatedConsortia();

    this.getOptions = this.getOptions.bind(this);
    this.getListItem = this.getListItem.bind(this);
    this.deleteConsortium = this.deleteConsortium.bind(this);
    this.joinConsortium = this.joinConsortium.bind(this);
    this.leaveConsortium = this.leaveConsortium.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.startPipeline = this.startPipeline.bind(this);
    this.stopPipeline = this.stopPipeline.bind(this);
  }

  static getDerivedStateFromProps(props) {
    const { auth, consortia } = props;
    const memberConsortia = [];
    const otherConsortia = [];
    if (consortia && consortia.length <= MAX_LENGTH_CONSORTIA) {
      consortia.forEach((cons) => {
        if (cons.owners.indexOf(auth.user.id) > -1 || cons.members.indexOf(auth.user.id) > -1) {
          memberConsortia.push(cons);
        } else {
          otherConsortia.push(cons);
        }
      });
    }
    return { memberConsortia, otherConsortia };
  }

  getOptions(member, owner, consortium) {
    const actions = [];
    const text = [];
    let isMapped = false;
    const { classes, pipelines, associatedConsortia, runs } = this.props;

    if (associatedConsortia.length > 0) {
      const assocCons = associatedConsortia.find(c => c.id === consortium.id);
      if (assocCons && assocCons.isMapped) {
        isMapped = assocCons.isMapped;
      }
    }

    // Add pipeline text
    text.push(
      <div key={`${consortium.id}-active-pipeline-text`} className={classes.contentContainer}>
        <Typography className={classes.labelInline}>
          Active Pipeline:
        </Typography>
        {
          consortium.activePipelineId
            ? <Typography className={classNames(classes.value, classes.green)}>{pipelines.find(pipe => pipe.id === consortium.activePipelineId).name}</Typography>
            : <Typography className={classNames(classes.value, classes.red)}>None</Typography>
        }
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

    if (owner && consortium.activePipelineId && isMapped) {
      const isPipelineRunning = runs.filter((run) => {
        return run.consortiumId === consortium.id && run.status === 'started';
      }).length > 0;

      actions.push(
        <Button
          key={`${consortium.id}-start-pipeline-button`}
          variant="contained"
          className={classes.button}
          onClick={this.startPipeline(consortium.id, consortium.activePipelineId)}
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
      actions.push(
        <Button
          key={`${consortium.id}-set-active-pipeline-button`}
          component={Link}
          to={`dashboard/consortia/${consortium.id}/1`}
          variant="contained"
          color="secondary"
          className={classes.button}
        >
          Set Active Pipeline
        </Button>
      );
    } else if ((owner || member) && !isMapped) {
      actions.push(
        <Button
          component={Link}
          to="dashboard/maps"
          variant="contained"
          color="secondary"
          className={classes.button}
          key={`${consortium.id}-set-map-local-button`}
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

  getListItem(consortium) {
    const { user } = this.props.auth;
    return (
      <ListItem
        key={`${consortium.id}-list-item`}
        itemObject={consortium}
        deleteItem={this.openModal}
        owner={isUserA(user.id, consortium.owners)}
        itemOptions={
          this.getOptions(
            isUserA(user.id, consortium.members),
            isUserA(user.id, consortium.owners),
            consortium
          )
        }
        itemRoute={'/dashboard/consortia'}
      />
    );
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  openModal(consortiumId) {
    return () => {
      this.setState({
        showModal: true,
        consortiumToDelete: consortiumId,
      });
    };
  }

  deleteConsortium() {
    this.props.removeCollectionsFromAssociatedConsortia(this.state.consortiumToDelete, true)
    .then(() => {
      this.props.deleteConsortiumById(this.state.consortiumToDelete);
      this.closeModal();
    });
  }

  joinConsortium(consortiumId, activePipelineId) {
    const { client, pipelines } = this.props;

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

      this.props.pullComputations({ consortiumId, computations });
      this.props.notifyInfo({
        message: 'Pipeline computations downloading via Docker.',
        autoDismiss: 5,
        action: {
          label: 'View Docker Download Progress',
          callback: () => {
            this.props.router.push('/dashboard/computations');
          },
        },
      });
    }

    this.props.saveAssociatedConsortia({ id: consortiumId, activePipelineId });
    this.props.joinConsortium(consortiumId);
  }

  leaveConsortium(consortiumId) {
    this.props.removeCollectionsFromAssociatedConsortia(consortiumId, true)
    .then(() => {
      this.props.leaveConsortium(consortiumId);
    });
  }

  stopPipeline(pipelineId) {
    return () => {
      const { client, runs } = this.props;
      
      const presentRun = runs.reduce( (prev, curr) => { 
        return prev.startDate > curr.startDate ? prev : curr ;
      });
      const runId = presentRun.id;
      
      ipcRenderer.send('stop-pipeline', { pipelineId, runId });
    }
  }

  startPipeline(consortiumId, activePipelineId) {
    return () => {
      const {
        client,
        router,
        incrementRunCount,
        saveLocalRun,
        createRun,
        notifyInfo,
        notifyWarning,
      } = this.props;

      let isRemotePipeline = false;
      const pipelineData = client.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
      let pipeline = pipelineData.fetchAllPipelines
        .find(pipe => pipe.id === activePipelineId);

      for (let i = 0; i < pipeline.steps.length; i += 1) {
        if (pipeline.steps[i].controller.type === 'decentralized') {
          isRemotePipeline = true;
          break;
        }
      }

      // Don't send local pipelines to Rethink
      if (!isRemotePipeline) {
        const data = client.readQuery({ query: FETCH_ALL_CONSORTIA_QUERY });
        const consortium = data.fetchAllConsortia.find(cons => cons.id === consortiumId);
        let run = {
          id: `local-${shortid.generate()}`,
          clients: [...consortium.members],
          consortiumId,
          pipelineSnapshot: pipeline,
          startDate: Date.now(),
          type: 'local',
          results: null,
          endDate: null,
          userErrors: null,
          __typename: 'Run',
        };

        return mapConsortiumData(consortiumId)
          .then((filesArray) => {
            notifyInfo({
              message: `Local Pipeline Starting for ${consortium.name}.`,
              action: {
                label: 'Watch Progress',
                callback: () => {
                  router.push('dashboard');
                },
              },
            });

            if ('steps' in filesArray) {
              run = {
                ...run,
                pipelineSnapshot: {
                  ...run.pipelineSnapshot,
                  steps: filesArray.steps,
                },
              };
              pipeline = {
                ...pipeline,
                steps: filesArray.steps,
              };
            }

            const status = 'started';

            run.status = status;

            incrementRunCount(consortiumId);
            ipcRenderer.send('start-pipeline', {
              consortium,
              pipeline,
              filesArray: filesArray.allFiles,
              run,
            });

            saveLocalRun({ ...run, status });
          })
          .catch((error) => {
            notifyWarning({
              message: error.message,
              autoDismiss: 5,
            });
          });
      }

      // If remote pipeline, call GraphQL to create new pipeline
      createRun(consortiumId);
    };
  }

  render() {
    const {
      consortia,
      classes,
    } = this.props;
    const {
      memberConsortia,
      otherConsortia,
    } = this.state;

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
          >
            <AddIcon />
          </Fab>
        </div>

        {consortia && consortia.length && consortia.length > MAX_LENGTH_CONSORTIA
          && consortia.map(consortium => this.getListItem(consortium))
        }
        {memberConsortia.length > 0 && <Typography variant="h6">Member Consortia</Typography>}
        {
          memberConsortia.length > 0
          && memberConsortia.map(consortium => this.getListItem(consortium))
        }
        {otherConsortia.length > 0 && <Typography variant="h6" className={classes.subtitle}>Other Consortia</Typography>}
        {
          otherConsortia.length > 0
          && otherConsortia.map(consortium => this.getListItem(consortium))
        }
        {
          (!consortia || !consortia.length)
          && (
            <Typography variant="body1">
              No consortia found
            </Typography>
          )
        }
        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.deleteConsortium}
          itemName="consortium"
          show={this.state.showModal}
          warningMessage="All pipelines associated with this consortium will also be deleted"
        />
      </div>
    );
  }
}

ConsortiaList.propTypes = {
  associatedConsortia: PropTypes.array.isRequired,
  auth: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  createRun: PropTypes.func.isRequired,
  deleteConsortiumById: PropTypes.func.isRequired,
  getAllAssociatedConsortia: PropTypes.func.isRequired,
  incrementRunCount: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
  pipelines: PropTypes.array.isRequired,
  pullComputations: PropTypes.func.isRequired,
  removeCollectionsFromAssociatedConsortia: PropTypes.func.isRequired,
  router: PropTypes.object.isRequired,
  saveAssociatedConsortia: PropTypes.func.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  runs: PropTypes.array.isRequired,
};

const mapStateToProps = ({ auth, collections: { associatedConsortia } }) => {
  return { auth, associatedConsortia };
};

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
  withApollo
)(ConsortiaList);

export default withStyles(styles)(
  connect(mapStateToProps,
    {
      getAllAssociatedConsortia,
      incrementRunCount,
      notifyInfo,
      notifyWarning,
      pullComputations,
      removeCollectionsFromAssociatedConsortia,
      saveAssociatedConsortia,
      saveLocalRun,
      updateUserPerms,
    })(ConsortiaListWithData)
);
