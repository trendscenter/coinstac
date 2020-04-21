import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { isEqual } from 'lodash';
import { withStyles } from '@material-ui/core/styles';
import {
  Drawer,
  Grid,
  Icon,
  List,
  ListItem,
  Typography,
} from '@material-ui/core';
import DashboardNav from './dashboard-nav';
import UserAccountController from '../user/user-account-controller';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
  writeLog,
} from '../../state/ducks/notifyAndLog';
import CoinstacAbbr from '../coinstac-abbr';
import { saveLocalRun, updateLocalRun } from '../../state/ducks/runs';
import {
  getDockerStatus,
  pullComputations,
  updateDockerOutput,
} from '../../state/ducks/docker';
import { updateUserConsortiaStatuses, updateUserPerms } from '../../state/ducks/auth';
import { appendLogMessage, clearLogs, loadLocalData } from '../../state/ducks/app';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  FETCH_ALL_THREADS_QUERY,
  PIPELINE_CHANGED_SUBSCRIPTION,
  USER_METADATA_CHANGED_SUBSCRIPTION,
  USER_RUN_CHANGED_SUBSCRIPTION,
  THREAD_CHANGED_SUBSCRIPTION,
  UPDATE_USER_CONSORTIUM_STATUS_MUTATION,
  UPDATE_CONSORTIA_MAPPED_USERS_MUTATION,
  FETCH_USER_QUERY,
} from '../../state/graphql/functions';
import {
  getAllAndSubProp,
  updateConsortiaMappedUsersProp,
} from '../../state/graphql/props';
import StartPipelineListener from './listeners/start-pipeline-listener';
import NotificationsListener from './listeners/notifications-listener';
import DisplayNotificationsListener from './listeners/display-notifications-listener';
import DashboardPipelineNavBar from './dashboard-pipeline-nav-bar';

const styles = theme => ({
  root: {
    display: 'flex',
  },
  gridContainer: {
    position: 'relative',
    minHeight: '100vh',
  },
  drawer: {
    flexShrink: 0,
  },
  drawerPaper: {
    backgroundColor: '#eee',
    position: 'absolute',
    right: 0,
  },
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing.unit * 3,
  },
  status: {
    display: 'inline-block',
    fontSize: '1.25rem',
    position: 'relative',
    width: '100%',
  },
  statusGood: {
    display: 'flex',
    alignItems: 'center',
  },
  statusUp: {
    width: '1rem',
    height: '1rem',
    background: '#5cb85c',
    borderRadius: '50%',
    marginLeft: '0.5rem',
  },
  statusDown: {
    display: 'inline-block',
    width: '100%',
    background: '#d9534f',
    borderRadius: '0.5rem',
    padding: '1rem',
    textAlign: 'center',
    textShadow: '1px 1px 0px rgba(0, 0, 0, 1)',
  },
  statusDownText: {
    color: 'white',
  },
});

let dockerInterval;

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dockerStatus: true,
      unsubscribeComputations: null,
      unsubscribeConsortia: null,
      unsubscribePipelines: null,
      unsubscribeThreads: null,
    };
  }

  componentDidMount() {
    const { auth: { user }, loadLocalData } = this.props;
    const { router } = this.context;

    loadLocalData();

    dockerInterval = setInterval(() => {
      let status = this.props.getDockerStatus();
      status.then((result) => {
        if( result == 'OK' ){
          this.setState({dockerStatus: true});
        }else{
          this.setState({dockerStatus: false});
        }
      }, (err) => {
        this.setState({dockerStatus: false});
      });
    }, 5000);

    process.nextTick(() => {
      if (!user.email.length) {
        this.props.writeLog({ type: 'verbose', message: 'Redirecting login (no authorized user)' });
        router.push('/login');
      }
    });

    ipcRenderer.on('docker-out', (event, arg) => {
      this.props.updateDockerOutput(arg);
    });

    ipcRenderer.on('docker-pull-complete', (event, arg) => {
      this.props.updateUserConsortiumStatus(arg, 'pipeline-computations-downloaded');
      this.props.notifySuccess(`${arg} Pipeline Computations Downloaded`);
    });

    ipcRenderer.on('local-pipeline-state-update', (event, arg) => {
      this.props.updateLocalRun(
        arg.run.id,
        { localPipelineState: arg.data }
      );
    });

    ipcRenderer.on('save-local-run', (event, arg) => {
      this.props.saveLocalRun({
        ...arg.run,
        status: 'started',
      });
    });

    ipcRenderer.on('local-run-complete', (event, arg) => {
      this.props.notifySuccess(`${arg.consName} Pipeline Complete.`);

      this.props.updateLocalRun(arg.run.id, { results: arg.run.results, status: 'complete' });
    });

    ipcRenderer.on('local-run-error', (event, arg) => {
      this.props.notifyError(`${arg.consName} Pipeline Error.`);

      this.props.updateLocalRun(arg.run.id, { error: arg.run.error, status: 'error' });
    });

    const { clearLogs } = this.props;
    clearLogs();

    ipcRenderer.on('log-message', (event, arg) => {
      const { appendLogMessage } = this.props;
      appendLogMessage(arg.data);
    });

    ipcRenderer.send('load-initial-log');

    this.unsubscribeToUserMetadata = this.props.subscribeToUserMetaData(user.id);
    this.unsubscribeToUserRuns = this.props.subscribeToUserRuns(user.id);

    ipcRenderer.on('docker-error', (event, arg) => {
      this.props.notifyError(`Docker Error: ${arg.err.message}`);
    });

    this.checkLocalMappedStatus(this.props.maps, this.props.consortia);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { auth: { user }, client } = this.props;
    const { router } = this.context;

    if (!isEqual(this.props.consortia, nextProps.consortia)) {
      this.checkLocalMappedStatus(nextProps.maps, nextProps.consortia);
    }

    if (nextProps.computations && !this.state.unsubscribeComputations) {
      this.setState({ unsubscribeComputations: this.props.subscribeToComputations(null) });
    }

    if (nextProps.consortia && !this.state.unsubscribeConsortia) {
      this.setState({ unsubscribeConsortia: this.props.subscribeToConsortia(null) });
    }

    if (nextProps.pipelines && !this.state.unsubscribePipelines) {
      this.setState({ unsubscribePipelines: this.props.subscribeToPipelines(null) });
    }

    if (nextProps.threads && !this.state.unsubscribeThreads) {
      this.setState({ unsubscribeThreads: this.props.subscribeToThreads(null) });
    }

    if (nextProps.remoteRuns) {
      // TODO: Speed this up by moving to subscription prop (n vs n^2)?
      for (let i = 0; i < nextProps.remoteRuns.length; i += 1) {
        let runIndexInLocalRuns = -1;
        let runIndexInPropsRemote = -1;

        // Find run in redux runs if it's there
        if (this.props.runs.length > 0) {
          runIndexInLocalRuns = this.props.runs
            .findIndex(run => run.id === nextProps.remoteRuns[i].id);
        }

        // Redux state seems to be behind a cycle, so also check component props
        if (runIndexInLocalRuns > -1
          || (runIndexInLocalRuns === -1 && !nextProps.remoteRuns[i].results
          && this.props.consortia.length)) {
          runIndexInPropsRemote = this.props.remoteRuns
            .findIndex(run => run.id === nextProps.remoteRuns[i].id);
        }

        if (runIndexInLocalRuns === -1 && nextProps.remoteRuns[i].results) {
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          this.props.saveLocalRun({ ...nextProps.remoteRuns[i], status: 'complete' });
          // Not saved locally, but error signify complete
        } else if (runIndexInLocalRuns === -1 && nextProps.remoteRuns[i].error) {
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          this.props.saveLocalRun({ ...nextProps.remoteRuns[i], status: 'error' });
          // Run already in props but error is incoming
        } else if (runIndexInLocalRuns > -1 && nextProps.remoteRuns[i].error
          && !this.props.runs[runIndexInLocalRuns].error && this.props.consortia.length
          && (!this.props.remoteRuns.length ||
            (runIndexInPropsRemote > -1 && !this.props.remoteRuns[runIndexInPropsRemote].error)
          )
        ) {
          const run = nextProps.remoteRuns[i];
          const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);

          // Update status of run in localDB
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          this.props.updateLocalRun(run.id, { error: run.error, status: 'error' });
          this.props.notifyError(`${consortium.name} Pipeline Error.`);

          // Run already in props but results are incoming
        } else if (runIndexInLocalRuns > -1 && nextProps.remoteRuns[i].results
          && runIndexInPropsRemote > -1
          && !this.props.runs[runIndexInLocalRuns].results && this.props.consortia.length
          && (!this.props.remoteRuns.length ||
            (runIndexInPropsRemote > -1 && !this.props.remoteRuns[runIndexInPropsRemote].results)
          )
        ) {
          const run = nextProps.remoteRuns[i];
          const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);

          // Update status of run in localDB
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          this.props.saveLocalRun({ ...run, status: 'complete' });
          this.props.notifySuccess(`${consortium.name} Pipeline Complete.`);
          // Looking for remote run state changes
        } else if (runIndexInPropsRemote > -1 && nextProps.remoteRuns[i].remotePipelineState
          && (!this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState ||
            (
              nextProps.remoteRuns[i].remotePipelineState.currentIteration
              !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.currentIteration
              || nextProps.remoteRuns[i].remotePipelineState.controllerState
              !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.controllerState
              || nextProps.remoteRuns[i].remotePipelineState.pipelineStep
              !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.pipelineStep
              ||
              (!nextProps.remoteRuns[i].remotePipelineState.waitingOn
               && this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
              ||
              (nextProps.remoteRuns[i].remotePipelineState.waitingOn
               && !this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
              ||
              (nextProps.remoteRuns[i].remotePipelineState.waitingOn
               && this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn
               && nextProps.remoteRuns[i].remotePipelineState.waitingOn.length
               !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn.length)
            )
          )
        ) {
          const run = nextProps.remoteRuns[i];

          // Update status of run in localDB
          this.props.updateLocalRun(
            run.id,
            { remotePipelineState: run.remotePipelineState }
          );
        }
      }
    }

    if (nextProps.consortia && this.props.consortia.length > 0) {
      for (let i = 0; i < nextProps.consortia.length; i += 1) {
        // Download Docker images for consortia activePipeline if user is a member
        if (this.props.consortia[i] && nextProps.consortia[i].id === this.props.consortia[i].id
            && nextProps.consortia[i].activePipelineId
            && !this.props.consortia[i].activePipelineId
            && nextProps.consortia[i].members.indexOf(user.id) > -1) {
          const computationData = client.readQuery({ query: FETCH_ALL_COMPUTATIONS_QUERY });
          const pipelineData = client.readQuery({ query: FETCH_ALL_PIPELINES_QUERY });
          const pipeline = pipelineData.fetchAllPipelines
            .find(cons => cons.id === nextProps.consortia[i].activePipelineId);

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

          this.props.pullComputations({ consortiumId: nextProps.consortia[i].id, computations });
          this.props.notifyInfo('Pipeline computations downloading via Docker.');
        }
      }
    }
  }

  componentDidUpdate(prevProps) {
    const { currentUser, updateUserPerms } = this.props;

    if (currentUser
      && (!prevProps.currentUser || prevProps.currentUser.permissions !== currentUser.permissions)
    ) {
      updateUserPerms(currentUser.permissions);
    }
  }

  componentWillUnmount() {
    clearInterval(dockerInterval);
    this.state.unsubscribeComputations();
    this.state.unsubscribeConsortia();
    this.state.unsubscribePipelines();
    this.state.unsubscribeThreads();

    this.unsubscribeToUserMetadata();
    this.unsubscribeToUserRuns();

    ipcRenderer.removeAllListeners('docker-out');
    ipcRenderer.removeAllListeners('docker-pull-complete');
    ipcRenderer.removeAllListeners('local-run-complete');
    ipcRenderer.removeAllListeners('local-run-error');
    ipcRenderer.removeAllListeners('local-pipeline-state-update');
    ipcRenderer.removeAllListeners('docker-error');
  }

  checkLocalMappedStatus = (maps, consortia) => {
    const { updateConsortiaMappedUsers, auth: { user } } = this.props;

    const consortiaCurrentlyUserIsMappedFor = consortia
      .filter(cons => cons.mappedForRun && cons.mappedForRun.indexOf(user.id) !== -1)
      .map(cons => cons.id);

    maps.forEach((map) => {
      const index = consortiaCurrentlyUserIsMappedFor.indexOf(map.consortiumId);

      if (index > -1) {
        consortiaCurrentlyUserIsMappedFor.splice(index, 1);
      }
    });

    updateConsortiaMappedUsers({ consortia: consortiaCurrentlyUserIsMappedFor });
  }

  goBack = () => {
    if (!this.canShowBackButton) {
      return;
    }

    const { auth } = this.props;
    const { locationStacks } = auth;

    this.props.router.push(locationStacks[locationStacks.length - 2]);
  }

  get canShowBackButton() {
    const { auth } = this.props;
    const { locationStacks } = auth;

    return locationStacks.length > 1;
  }

  get unreadThreadCount() {
    const { auth, threads } = this.props;

    if (!auth || !threads || threads.length === 0) {
      return 0;
    }

    const { id: userId } = auth.user;

    const unreadThreads = threads.filter(thread => {
      return thread.users
        .filter(({ username, isRead }) =>
          username === userId && !isRead
        ).length > 0;
    });

    return unreadThreads.length;
  }

  render() {
    const {
      auth,
      children,
      computations,
      consortia,
      pipelines,
      runs,
      remoteRuns,
      threads,
      classes,
    } = this.props;
    const { dockerStatus } = this.state;
    const { router } = this.context;

    const childrenWithProps = React.cloneElement(children, {
      computations, consortia, pipelines, runs, threads,
    });

    if (!auth || !auth.user.email.length) {
      return (<p>Redirecting to login...</p>);
    }

    // @TODO don't render primary content whilst still loading/bg-services
    return (
      <React.Fragment>
        <Grid container>
          <Grid item xs={12} sm={3} className={classes.gridContainer}>
            <Drawer
              variant="permanent"
              anchor="left"
              className={classes.drawer}
              classes={{
                paper: classes.drawerPaper,
              }}
            >
              <CoinstacAbbr />
              <DashboardNav user={auth.user} />
              <List>
                <ListItem>
                  <UserAccountController push={router.push} unreadThreadCount={this.unreadThreadCount} />
                </ListItem>
              </List>
              <List>
                <ListItem>
                  { dockerStatus
                    ? (
                      <span className={classes.statusGood}>
                        <Typography variant="subtitle2">
                          Docker Status:
                        </Typography>
                        <span className={classes.statusUp} />
                      </span>
                    )
                    : (
                      <span className={classes.statusDown}>
                        <Typography
                          variant="body2"
                          classes={{
                            root: classes.statusDownText,
                          }}
                        >
                          Docker Is Not Running!
                        </Typography>
                      </span>
                    )
                  }
                </ListItem>
              </List>
            </Drawer>
          </Grid>
          <Grid item xs={12} sm={9}>
            <DashboardPipelineNavBar router={router} consortia={consortia} localRuns={runs} />
            <main className="content-pane">
              {this.canShowBackButton && (
                <button
                  className="back-button"
                  onClick={this.goBack}
                >
                  <Icon className="fa fa-arrow-up arrow-icon"/>
                </button>
              )}
              {childrenWithProps}
            </main>
          </Grid>
        </Grid>
        <StartPipelineListener
          router={router}
          consortia={consortia}
          remoteRuns={remoteRuns}
        />
        <NotificationsListener />
        <DisplayNotificationsListener />
      </React.Fragment>
    );
  }
}

Dashboard.displayName = 'Dashboard';

Dashboard.contextTypes = {
  router: PropTypes.object,
};

Dashboard.defaultProps = {
  computations: [],
  consortia: [],
  maps: [],
  pipelines: [],
  remoteRuns: [],
  runs: [],
  currentUser: null,
};

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  client: PropTypes.object.isRequired,
  computations: PropTypes.array,
  consortia: PropTypes.array,
  getDockerStatus: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  maps: PropTypes.array,
  pipelines: PropTypes.array,
  pullComputations: PropTypes.func.isRequired,
  remoteRuns: PropTypes.array,
  runs: PropTypes.array,
  saveLocalRun: PropTypes.func.isRequired,
  subscribeToComputations: PropTypes.func.isRequired,
  subscribeToConsortia: PropTypes.func.isRequired,
  subscribeToPipelines: PropTypes.func.isRequired,
  subscribeToUserRuns: PropTypes.func.isRequired,
  updateDockerOutput: PropTypes.func.isRequired,
  updateLocalRun: PropTypes.func.isRequired,
  updateUserConsortiumStatus: PropTypes.func.isRequired,
  clearLogs: PropTypes.func.isRequired,
  appendLogMessage: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
  updateUserPerms: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  loadLocalData: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

function mapStateToProps({ auth, runs: { runs }, maps }) {
  return {
    auth,
    runs,
    maps: maps.consortiumDataMappings,
  };
}

const DashboardWithData = compose(
  graphql(FETCH_ALL_COMPUTATIONS_QUERY, getAllAndSubProp(
    COMPUTATION_CHANGED_SUBSCRIPTION,
    'computations',
    'fetchAllComputations',
    'subscribeToComputations',
    'computationChanged'
  )),
  graphql(FETCH_ALL_USER_RUNS_QUERY, getAllAndSubProp(
    USER_RUN_CHANGED_SUBSCRIPTION,
    'remoteRuns',
    'fetchAllUserRuns',
    'subscribeToUserRuns',
    'userRunChanged',
    'userId'
  )),
  graphql(FETCH_ALL_CONSORTIA_QUERY, getAllAndSubProp(
    CONSORTIUM_CHANGED_SUBSCRIPTION,
    'consortia',
    'fetchAllConsortia',
    'subscribeToConsortia',
    'consortiumChanged'
  )),
  graphql(FETCH_ALL_PIPELINES_QUERY, getAllAndSubProp(
    PIPELINE_CHANGED_SUBSCRIPTION,
    'pipelines',
    'fetchAllPipelines',
    'subscribeToPipelines',
    'pipelineChanged'
  )),
  graphql(FETCH_ALL_THREADS_QUERY, getAllAndSubProp(
    THREAD_CHANGED_SUBSCRIPTION,
    'threads',
    'fetchAllThreads',
    'subscribeToThreads',
    'threadChanged'
  )),
  graphql(FETCH_USER_QUERY, {
    skip: props => !props.auth || !props.auth.user || !props.auth.user.id,
    options: props => ({
      fetchPolicy: 'cache-and-network',
      variables: { userId: props.auth.user.id },
    }),
    props: props => ({
      currentUser: props.data.fetchUser,
      subscribeToUserMetaData: userId => props.data.subscribeToMore({
        document: USER_METADATA_CHANGED_SUBSCRIPTION,
        variables: { userId },
        updateQuery: (prevResult, { subscriptionData: { data } }) => {
          if (data.userMetadataChanged.delete) {
            return { fetchUser: null };
          }
          return { fetchUser: data.userMetadataChanged };
        },
      }),
    }),
  }),
  graphql(UPDATE_USER_CONSORTIUM_STATUS_MUTATION, {
    props: ({ ownProps, mutate }) => ({
      updateUserConsortiumStatus: (consortiumId, status) => mutate({
        variables: { consortiumId, status },
      })
      .then(({ data: { updateUserConsortiumStatus: { consortiaStatuses } } }) => {
        return ownProps.updateUserConsortiaStatuses(consortiaStatuses);
      }),
    }),
  }),
  graphql(
    UPDATE_CONSORTIA_MAPPED_USERS_MUTATION,
    updateConsortiaMappedUsersProp('updateConsortiaMappedUsers'),
  ),
  withApollo
)(Dashboard);

const connectedComponent = connect(mapStateToProps,
  {
    getDockerStatus,
    notifyError,
    notifyInfo,
    notifySuccess,
    pullComputations,
    saveLocalRun,
    updateDockerOutput,
    updateLocalRun,
    updateUserConsortiaStatuses,
    writeLog,
    updateUserPerms,
    clearLogs,
    appendLogMessage,
    loadLocalData,
  })(DashboardWithData);

export default withStyles(styles)(connectedComponent);
