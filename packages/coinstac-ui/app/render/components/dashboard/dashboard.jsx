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
import { appendLogMessage } from '../../state/ducks/app';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  FETCH_ALL_THREADS_QUERY,
  PIPELINE_CHANGED_SUBSCRIPTION,
  USER_CHANGED_SUBSCRIPTION,
  USER_RUN_CHANGED_SUBSCRIPTION,
  THREAD_CHANGED_SUBSCRIPTION,
  UPDATE_USER_CONSORTIUM_STATUS_MUTATION,
  UPDATE_CONSORTIA_MAPPED_USERS_MUTATION,
  FETCH_USER_QUERY,
} from '../../state/graphql/functions';
import {
  getAllAndSubProp,
  updateConsortiaMappedUsersProp,
  userRunProp,
} from '../../state/graphql/props';
import StartPipelineListener from './listeners/start-pipeline-listener';
import NotificationsListener from './listeners/notifications-listener';
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
    padding: theme.spacing(3),
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
    const {
      auth: { user },
      maps,
      consortia,
      getDockerStatus,
      writeLog,
      updateDockerOutput,
      updateUserConsortiumStatus,
      notifySuccess,
      notifyError,
      updateLocalRun,
      saveLocalRun,
      subscribeToUser,
      subscribeToUserRuns,
    } = this.props;
    const { router } = this.context;

    dockerInterval = setInterval(() => {
      const status = getDockerStatus();
      status.then((result) => {
        if (result === 'OK') {
          this.setState({ dockerStatus: true });
        } else {
          this.setState({ dockerStatus: false });
        }
      }, () => {
        this.setState({ dockerStatus: false });
      });
    }, 5000);

    process.nextTick(() => {
      if (!user.email.length) {
        writeLog({ type: 'verbose', message: 'Redirecting login (no authorized user)' });
        router.push('/login');
      }
    });

    ipcRenderer.on('docker-out', (_event, arg) => {
      updateDockerOutput(arg);
    });

    ipcRenderer.on('docker-pull-complete', (event, arg) => {
      updateUserConsortiumStatus(arg, 'pipeline-computations-downloaded');
      notifySuccess(`${arg} Pipeline Computations Downloaded`);
    });

    ipcRenderer.on('local-pipeline-state-update', (event, arg) => {
      updateLocalRun(
        arg.run.id,
        { localPipelineState: arg.data }
      );
    });

    ipcRenderer.on('save-local-run', (event, arg) => {
      saveLocalRun({
        ...arg.run,
        status: 'started',
      });
    });

    ipcRenderer.on('local-run-complete', (event, arg) => {
      notifySuccess(`${arg.consName} Pipeline Complete.`);

      updateLocalRun(arg.run.id, { results: arg.run.results, status: 'complete', type: arg.run.type });
    });

    ipcRenderer.on('local-run-error', (event, arg) => {
      notifyError(`${arg.consName} Pipeline Error.`);

      updateLocalRun(arg.run.id, { error: arg.run.error, status: 'error', type: arg.run.type });
    });

    ipcRenderer.on('log-message', (event, arg) => {
      const { appendLogMessage } = this.props;
      appendLogMessage(arg.data);
    });

    ipcRenderer.send('load-initial-log');

    this.unsubscribeToUser = subscribeToUser(user.id);
    this.unsubscribeToUserRuns = subscribeToUserRuns(user.id);

    ipcRenderer.on('docker-error', (event, arg) => {
      notifyError(`Docker Error: ${arg.err.message}`);
    });

    this.checkLocalMappedStatus(maps, consortia);
  }

  // eslint-disable-next-line
  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      auth: { user },
      client,
      consortia,
      runs,
      remoteRuns,
      subscribeToComputations,
      subscribeToConsortia,
      subscribeToPipelines,
      subscribeToThreads,
      saveLocalRun,
      updateLocalRun,
      pullComputations,
      notifyInfo,
      notifySuccess,
      notifyError,
    } = this.props;
    const {
      unsubscribeComputations, unsubscribeConsortia, unsubscribePipelines, unsubscribeThreads,
    } = this.state;

    if (!isEqual(consortia, nextProps.consortia)) {
      this.checkLocalMappedStatus(nextProps.maps, nextProps.consortia);
    }

    if (nextProps.computations && !unsubscribeComputations) {
      this.setState({ unsubscribeComputations: subscribeToComputations(null) });
    }

    if (nextProps.consortia && !unsubscribeConsortia) {
      this.setState({ unsubscribeConsortia: subscribeToConsortia(null) });
    }

    if (nextProps.pipelines && !unsubscribePipelines) {
      this.setState({ unsubscribePipelines: subscribeToPipelines(null) });
    }

    if (nextProps.threads && !unsubscribeThreads) {
      this.setState({ unsubscribeThreads: subscribeToThreads(null) });
    }

    if (nextProps.remoteRuns) {
      // TODO: Speed this up by moving to subscription prop (n vs n^2)?
      for (let i = 0; i < nextProps.remoteRuns.length; i += 1) {
        let runIndexInLocalRuns = -1;
        let runIndexInPropsRemote = -1;

        // Find run in redux runs if it's there
        if (runs.length > 0) {
          runIndexInLocalRuns = runs
            .findIndex(run => run.id === nextProps.remoteRuns[i].id);
        }

        // Redux state seems to be behind a cycle, so also check component props
        if (runIndexInLocalRuns > -1
          || (runIndexInLocalRuns === -1 && !nextProps.remoteRuns[i].results
          && consortia.length)) {
          runIndexInPropsRemote = remoteRuns
            .findIndex(run => run.id === nextProps.remoteRuns[i].id);
        }

        if (runIndexInLocalRuns === -1 && nextProps.remoteRuns[i].results) {
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          saveLocalRun({ ...nextProps.remoteRuns[i], status: 'complete' });
          // Not saved locally, but error signify complete
        } else if (runIndexInLocalRuns === -1 && nextProps.remoteRuns[i].error) {
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          saveLocalRun({ ...nextProps.remoteRuns[i], status: 'error' });
          // Run already in props but error is incoming
        } else if (runIndexInLocalRuns > -1 && nextProps.remoteRuns[i].error
          && !runs[runIndexInLocalRuns].error && consortia.length
          && (!remoteRuns.length
            || (runIndexInPropsRemote > -1 && !remoteRuns[runIndexInPropsRemote].error)
          )
        ) {
          const run = nextProps.remoteRuns[i];
          const consortium = consortia.find(obj => obj.id === run.consortiumId);

          // Update status of run in localDB
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          updateLocalRun(run.id, { error: run.error, status: 'error', type: run.type });
          notifyError(`${consortium.name} Pipeline Error.`);

          // Run already in props but results are incoming
        } else if (runIndexInLocalRuns > -1 && nextProps.remoteRuns[i].results
          && runIndexInPropsRemote > -1
          && !runs[runIndexInLocalRuns].results && consortia.length
          && (!remoteRuns.length
            || (runIndexInPropsRemote > -1 && !remoteRuns[runIndexInPropsRemote].results)
          )
        ) {
          const run = nextProps.remoteRuns[i];
          const consortium = consortia.find(obj => obj.id === run.consortiumId);

          // Update status of run in localDB
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          saveLocalRun({ ...run, status: 'complete' });
          notifySuccess(`${consortium.name} Pipeline Complete.`);
          // Looking for remote run state changes
        } else if (runIndexInPropsRemote > -1 && nextProps.remoteRuns[i].remotePipelineState
          && (!remoteRuns[runIndexInPropsRemote].remotePipelineState
            || (
              nextProps.remoteRuns[i].remotePipelineState.currentIteration
              !== remoteRuns[runIndexInPropsRemote].remotePipelineState.currentIteration
              || nextProps.remoteRuns[i].remotePipelineState.controllerState
              !== remoteRuns[runIndexInPropsRemote].remotePipelineState.controllerState
              || nextProps.remoteRuns[i].remotePipelineState.pipelineStep
              !== remoteRuns[runIndexInPropsRemote].remotePipelineState.pipelineStep
              || (!nextProps.remoteRuns[i].remotePipelineState.waitingOn
               && remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
              || (nextProps.remoteRuns[i].remotePipelineState.waitingOn
               && !remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
              || (nextProps.remoteRuns[i].remotePipelineState.waitingOn
               && remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn
               && nextProps.remoteRuns[i].remotePipelineState.waitingOn.length
               !== remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn.length)
            )
          )
        ) {
          const run = nextProps.remoteRuns[i];

          // Update status of run in localDB
          updateLocalRun(
            run.id,
            { remotePipelineState: run.remotePipelineState }
          );
        }
      }
    }

    if (nextProps.consortia && consortia.length > 0) {
      for (let i = 0; i < nextProps.consortia.length; i += 1) {
        // Download Docker images for consortia activePipeline if user is a member
        if (consortia[i] && nextProps.consortia[i].id === consortia[i].id
            && nextProps.consortia[i].activePipelineId
            && !consortia[i].activePipelineId
            && user.id in nextProps.consortia[i].members
        ) {
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

          pullComputations({ consortiumId: nextProps.consortia[i].id, computations });
          notifyInfo('Pipeline computations downloading via Docker.');
        }
      }
    }
  }

  componentDidUpdate(prevProps) {
    const {
      currentUser, updateUserPerms, remoteRuns, saveLocalRun,
    } = this.props;

    if (currentUser
      && (!prevProps.currentUser || prevProps.currentUser.permissions !== currentUser.permissions)
    ) {
      updateUserPerms(currentUser.permissions);
    }

    if (prevProps.remoteRuns.length === 0 && remoteRuns.length > prevProps.remoteRuns.length) {
      remoteRuns
        .filter(run => run.type === 'local')
        .forEach(run => saveLocalRun(run));
    }
  }

  componentWillUnmount() {
    const {
      unsubscribeComputations, unsubscribeConsortia, unsubscribePipelines, unsubscribeThreads,
    } = this.state;

    clearInterval(dockerInterval);
    unsubscribeComputations();
    unsubscribeConsortia();
    unsubscribePipelines();
    unsubscribeThreads();

    this.unsubscribeToUser();
    this.unsubscribeToUserRuns();

    ipcRenderer.removeAllListeners('docker-out');
    ipcRenderer.removeAllListeners('docker-pull-complete');
    ipcRenderer.removeAllListeners('local-run-complete');
    ipcRenderer.removeAllListeners('local-run-error');
    ipcRenderer.removeAllListeners('local-pipeline-state-update');
    ipcRenderer.removeAllListeners('docker-error');
  }

  goBack = () => {
    if (!this.canShowBackButton) {
      return;
    }

    const { router } = this.context;
    const { auth } = this.props;
    const { locationStacks } = auth;

    router.push(locationStacks[locationStacks.length - 2]);
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

    const unreadThreads = threads.filter(thread => userId in thread && !thread[userId].isRead);

    return unreadThreads.length;
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
          <Grid item xs={12} sm={5} md={3} lg={2} className={classes.gridContainer}>
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
                  <UserAccountController
                    push={router.push}
                    unreadThreadCount={this.unreadThreadCount}
                  />
                </ListItem>
                <ListItem>
                  {dockerStatus ? (
                    <span className={classes.statusGood}>
                      <Typography variant="subtitle2">
                        Docker Status:
                      </Typography>
                      <span className={classes.statusUp} />
                    </span>
                  ) : (
                    <span className={classes.statusDown}>
                      <Typography
                        variant="body1"
                        classes={{
                          root: classes.statusDownText,
                        }}
                      >
                        Docker Is Not Running!
                      </Typography>
                    </span>
                  )}
                </ListItem>
              </List>
            </Drawer>
          </Grid>
          <Grid item xs={12} sm={7} md={9} lg={10}>
            <DashboardPipelineNavBar router={router} consortia={consortia} localRuns={runs} />
            <main className="content-pane">
              {this.canShowBackButton && (
                <button
                  type="button"
                  className="back-button"
                  onClick={this.goBack}
                >
                  <Icon className="fa fa-arrow-up arrow-icon" />
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
      </React.Fragment>
    );
  }
}

Dashboard.displayName = 'Dashboard';

Dashboard.contextTypes = {
  router: PropTypes.object.isRequired,
};

Dashboard.defaultProps = {
  computations: [],
  consortia: [],
  maps: [],
  pipelines: [],
  remoteRuns: [],
  runs: [],
  threads: [],
  currentUser: null,
};

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  classes: PropTypes.object.isRequired,
  client: PropTypes.object.isRequired,
  computations: PropTypes.array,
  consortia: PropTypes.array,
  currentUser: PropTypes.object,
  maps: PropTypes.array,
  pipelines: PropTypes.array,
  remoteRuns: PropTypes.array,
  runs: PropTypes.array,
  threads: PropTypes.array,
  appendLogMessage: PropTypes.func.isRequired,
  getDockerStatus: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  pullComputations: PropTypes.func.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
  subscribeToComputations: PropTypes.func.isRequired,
  subscribeToConsortia: PropTypes.func.isRequired,
  subscribeToPipelines: PropTypes.func.isRequired,
  subscribeToThreads: PropTypes.func.isRequired,
  subscribeToUser: PropTypes.func.isRequired,
  subscribeToUserRuns: PropTypes.func.isRequired,
  updateConsortiaMappedUsers: PropTypes.func.isRequired,
  updateDockerOutput: PropTypes.func.isRequired,
  updateLocalRun: PropTypes.func.isRequired,
  updateUserConsortiumStatus: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
  updateUserPerms: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, runs, maps }) => ({
  auth,
  runs: runs.runs,
  maps: maps.consortiumDataMappings,
});

const DashboardWithData = compose(
  graphql(FETCH_ALL_COMPUTATIONS_QUERY, getAllAndSubProp(
    COMPUTATION_CHANGED_SUBSCRIPTION,
    'computations',
    'fetchAllComputations',
    'subscribeToComputations',
    'computationChanged'
  )),
  graphql(FETCH_ALL_USER_RUNS_QUERY, userRunProp(
    USER_RUN_CHANGED_SUBSCRIPTION
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
      subscribeToUser: userId => props.data.subscribeToMore({
        document: USER_CHANGED_SUBSCRIPTION,
        variables: { userId },
        updateQuery: (prevResult, { subscriptionData: { data } }) => {
          if (data.userChanged.delete) {
            return { fetchUser: null };
          }
          return {
            fetchUser: {
              ...prevResult.fetchUser,
              ...data.userChanged,
            },
          };
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
    updateConsortiaMappedUsersProp('updateConsortiaMappedUsers')
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
    appendLogMessage,
  })(DashboardWithData);

export default withStyles(styles)(connectedComponent);
