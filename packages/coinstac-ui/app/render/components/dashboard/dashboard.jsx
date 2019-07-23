import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import theme from '../../styles/material-ui/theme';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Typography from '@material-ui/core/Typography';
import DashboardNav from './dashboard-nav';
import UserAccountController from '../user/user-account-controller';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
  writeLog,
} from '../../state/ducks/notifyAndLog';
import CoinstacAbbr from '../coinstac-abbr';
import { getCollectionFiles, incrementRunCount, syncRemoteLocalConsortia, syncRemoteLocalPipelines } from '../../state/ducks/collections';
import { getLocalRun, getDBRuns, saveLocalRun, updateLocalRun } from '../../state/ducks/runs';
import {
  getDockerStatus,
  pullComputations,
  updateDockerOutput,
} from '../../state/ducks/docker';
import { updateUserConsortiaStatuses, updateUserPerms } from '../../state/ducks/auth';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  PIPELINE_CHANGED_SUBSCRIPTION,
  USER_CHANGED_SUBSCRIPTION,
  USER_METADATA_CHANGED_SUBSCRIPTION,
  USER_RUN_CHANGED_SUBSCRIPTION,
  UPDATE_USER_CONSORTIUM_STATUS_MUTATION,
  FETCH_USER_QUERY,
} from '../../state/graphql/functions';
import {
  getAllAndSubProp,
  getSelectAndSubProp,
} from '../../state/graphql/props';

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

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.props.getDBRuns();

    this.state = {
      dockerStatus: true,
      unsubscribeComputations: null,
      unsubscribeConsortia: null,
      unsubscribePipelines: null,
      unsubscribeRuns: null,
      unsubscribeUsers: null,
      unsubscribeToUserMetadata: null,
    };
  }

  componentDidMount() {
    const { auth: { user } } = this.props;
    const { router } = this.context;

    setInterval(() => {
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
      this.props.notifySuccess({
        message: `${arg} Pipeline Computations Downloaded`,
      });
    });

    ipcRenderer.on('local-pipeline-state-update', (event, arg) => {
      this.props.updateLocalRun(
        arg.run.id,
        { localPipelineState: arg.data }
      );
    });

    ipcRenderer.on('local-run-complete', (event, arg) => {
      this.props.notifySuccess({
        message: `${arg.consName} Pipeline Complete.`,
        autoDismiss: 5,
        action: {
          label: 'View Results',
          callback: () => {
            router.push(`dashboard/results/${arg.run.id}`);
          },
        },
      });

      this.props.updateLocalRun(arg.run.id, { results: arg.run.results, status: 'complete' });
    });

    ipcRenderer.on('local-run-error', (event, arg) => {
      this.props.notifyError({
        message: `${arg.consName} Pipeline Error.`,
        autoDismiss: 5,
        action: {
          label: 'View Error',
          callback: () => {
            router.push(`dashboard/results/${arg.run.id}`);
          },
        },
      });

      this.props.updateLocalRun(arg.run.id, { error: arg.run.error, status: 'error' });
    });

    this.unsubscribeToUserMetadata = this.props.subscribeToUserMetaData(user.id);

    ipcRenderer.on('docker-error', (event, arg) => {
      this.props.notifyError({
        message: `Docker Error: ${arg.err.message}`,
        autoDismiss: 5
      });
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { auth: { user }, client } = this.props;
    const { router } = this.context;

    if (nextProps.computations && !this.state.unsubscribeComputations) {
      this.setState({ unsubscribeComputations: this.props.subscribeToComputations(null) });
    }

    if (nextProps.consortia && !this.state.unsubscribeConsortia) {
      this.setState({ unsubscribeConsortia: this.props.subscribeToConsortia(null) });
    }

    if (nextProps.pipelines && !this.state.unsubscribePipelines) {
      this.setState({ unsubscribePipelines: this.props.subscribeToPipelines(null) });
    }

    if (nextProps.remoteRuns && !this.state.unsubscribeRuns) {
      this.setState({ unsubscribeRuns: this.props.subscribeToUserRuns(null) });
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

        // Run not in local props, start a pipeline (runs already filtered by member)
        if (runIndexInLocalRuns === -1 && !nextProps.remoteRuns[i].results
          && this.props.consortia.length && runIndexInPropsRemote === -1
          && !nextProps.remoteRuns[i].error
        ) {
          let run = nextProps.remoteRuns[i];
          const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);

          this.props.getCollectionFiles(
            run.consortiumId, consortium.name, run.pipelineSnapshot.steps
          )
          .then((filesArray) => {
            let status = 'started';

            if ('error' in filesArray) {
              status = 'needs-map';
              this.props.notifyWarning({
                message: filesArray.error,
                autoDismiss: 5,
              });
            } else {
              // Save run status to localDB
              this.props.saveLocalRun({ ...run, status });

              if ('steps' in filesArray) {
                run = {
                  ...run,
                  pipelineSnapshot: {
                    ...run.pipelineSnapshot,
                    steps: filesArray.steps,
                  },
                };
              }

              this.props.incrementRunCount(consortium.id);
              this.props.notifyInfo({
                message: `Decentralized Pipeline Starting for ${consortium.name}.`,
                action: {
                  label: 'Watch Progress',
                  callback: () => {
                    router.push('dashboard');
                  },
                },
              });

              this.props.incrementRunCount(consortium.id);
              ipcRenderer.send('start-pipeline', {
                consortium,
                pipeline: run.pipelineSnapshot,
                filesArray: filesArray.allFiles,
                run: { ...run, status },
              });
            }
          });
          // Not saved locally, but results signify complete
        } else if (runIndexInLocalRuns === -1 && nextProps.remoteRuns[i].results) {
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
          this.props.notifyError({
            message: `${consortium.name} Pipeline Error.`,
            autoDismiss: 5,
            action: {
              label: 'View Error',
              callback: () => {
                router.push(`dashboard/results/${run.id}`);
              },
            },
          });

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
          this.props.notifySuccess({
            message: `${consortium.name} Pipeline Complete.`,
            autoDismiss: 5,
            action: {
              label: 'View Results',
              callback: () => {
                router.push(`dashboard/results/${run.id}`);
              },
            },
          });
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
              (!nextProps.remoteRuns[i].remotePipelineState.waitingOn && this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
              ||
              (nextProps.remoteRuns[i].remotePipelineState.waitingOn && !this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
              ||
              (nextProps.remoteRuns[i].remotePipelineState.waitingOn && this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn && nextProps.remoteRuns[i].remotePipelineState.waitingOn.length !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn.length)
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

    if (nextProps.pipelines) {
      // Check associated consortia to see if activepipelineid matches.
      //  If so check if pipeline steps match. If they don't, clear.
      for (let i = 0; i < nextProps.pipelines.length; i += 1) {
        this.props.syncRemoteLocalPipelines(nextProps.pipelines[i]);
      }
    }

    if (nextProps.consortia) {
      // If member or owner, check consortia activePipeline against
      //  localDB assocCons activePipelineId. If different, clear steps
      //  & activePipelineId, delete stepIO, remove assocCons in collections
      for (let i = 0; i < nextProps.consortia.length; i += 1) {
        if (nextProps.consortia[i].members.indexOf(user.id) > -1
            || nextProps.consortia[i].owners.indexOf(user.id) > -1) {
          let steps = [];
          if (nextProps.consortia[i].activePipelineId && this.props.pipelines.length) {
            steps = this.props.pipelines
              .find(p => p.id === nextProps.consortia[i].activePipelineId).steps;
          }
          this.props.syncRemoteLocalConsortia(nextProps.consortia[i], steps);
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
          this.props.notifyInfo({
            message: 'Pipeline computations downloading via Docker.',
            autoDismiss: 5,
            action: {
              label: 'View Docker Download Progress',
              callback: () => {
                router.push('/dashboard/computations');
              },
            },
          });
        }
      }
    }
  }

  componentDidUpdate(prevProps) {
    const { currentUser } = this.props;
    if (currentUser &&
      (!prevProps.currentUser || prevProps.currentUser.permissions !== currentUser.permissions)
    ) {
      this.props.updateUserPerms(currentUser.permissions);
    }
  }

  componentWillUnmount() {
    this.state.unsubscribeComputations();
    this.state.unsubscribeConsortia();
    this.state.unsubscribePipelines();
    this.state.unsubscribeRuns();

    if (typeof this.unsubscribeToUserMetadata === 'function') {
      this.unsubscribeToUserMetadata();
    }

    ipcRenderer.removeAllListeners('docker-out');
    ipcRenderer.removeAllListeners('docker-pull-complete');
    ipcRenderer.removeAllListeners('local-run-complete');
    ipcRenderer.removeAllListeners('local-run-error');
    ipcRenderer.removeAllListeners('local-pipeline-state-update');
    ipcRenderer.removeAllListeners('docker-error');
  }

  render() {
    const { auth, children, computations, consortia, pipelines, runs, classes } = this.props;
    const { dockerStatus } = this.state;
    const { router } = this.context;

    const childrenWithProps = React.cloneElement(children, {
      computations, consortia, pipelines, runs,
    });

    if (!auth || !auth.user.email.length) {
      return (<p>Redirecting to login...</p>);
    }

    // @TODO don't render primary content whilst still loading/bg-services
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
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
              <DashboardNav auth={auth} />
              <List>
                <ListItem>
                  <UserAccountController push={router.push} />
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
            <main className="content-pane">
              {childrenWithProps}
            </main>
          </Grid>
        </Grid>
      </MuiThemeProvider>
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
  getCollectionFiles: PropTypes.func.isRequired,
  getDBRuns: PropTypes.func.isRequired,
  getDockerStatus: PropTypes.func.isRequired,
  incrementRunCount: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
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
  syncRemoteLocalConsortia: PropTypes.func.isRequired,
  syncRemoteLocalPipelines: PropTypes.func.isRequired,
  updateDockerOutput: PropTypes.func.isRequired,
  updateLocalRun: PropTypes.func.isRequired,
  updateUserConsortiumStatus: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
  updateUserPerms: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired,
};

function mapStateToProps({ auth, runs: { runs } }) {
  return {
    auth,
    runs,
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
  graphql(FETCH_USER_QUERY, {
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
      })
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
  withApollo
)(Dashboard);

const connectedComponent = connect(mapStateToProps,
  {
    getCollectionFiles,
    getLocalRun,
    getDBRuns,
    getDockerStatus,
    incrementRunCount,
    notifyError,
    notifyInfo,
    notifySuccess,
    notifyWarning,
    pullComputations,
    saveLocalRun,
    syncRemoteLocalConsortia,
    syncRemoteLocalPipelines,
    updateDockerOutput,
    updateLocalRun,
    updateUserConsortiaStatuses,
    writeLog,
    updateUserPerms,
  })(DashboardWithData);

export default withStyles(styles)(connectedComponent);
