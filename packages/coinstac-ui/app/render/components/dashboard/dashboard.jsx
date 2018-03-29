import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
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
  pullComputations,
  updateDockerOutput,
} from '../../state/ducks/docker';
import { updateUserConsortiaStatuses } from '../../state/ducks/auth';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  PIPELINE_CHANGED_SUBSCRIPTION,
  USER_RUN_CHANGED_SUBSCRIPTION,
  UPDATE_USER_CONSORTIUM_STATUS_MUTATION,
} from '../../state/graphql/functions';
import {
  getAllAndSubProp,
} from '../../state/graphql/props';

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.props.getDBRuns();

    this.state = {
      unsubscribeComputations: null,
      unsubscribeConsortia: null,
      unsubscribePipelines: null,
      unsubscribeRuns: null,
    };
  }

  componentDidMount() {
    const { auth: { user } } = this.props;
    const { router } = this.context;

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
        'localPipelineState',
        arg.data
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

      this.props.saveLocalRun({ ...arg.run, status: 'complete' });
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

      this.props.saveLocalRun({ ...arg.run, status: 'error' });
    });
  }

  componentWillReceiveProps(nextProps) {
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

    if (nextProps.remoteRuns && this.props.consortia.length) {
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

              // 5 second timeout to ensure no port conflicts in
              //  development env between remote and client pipelines
              setTimeout(() => {
                this.props.incrementRunCount(consortium.id);
                ipcRenderer.send('start-pipeline', {
                  consortium,
                  pipeline: run.pipelineSnapshot,
                  filesArray: filesArray.allFiles,
                  run: { ...run, status },
                });
              }, 5000);
            }

            // Save run status to localDB
            this.props.saveLocalRun({ ...run, status });
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
          && !this.props.remoteRuns[runIndexInPropsRemote].error) {
          const run = nextProps.remoteRuns[i];
          const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);

          // Update status of run in localDB
          ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
          this.props.saveLocalRun({ ...run, status: 'error' });
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
          && !this.props.runs[runIndexInLocalRuns].results && this.props.consortia.length
          && !this.props.remoteRuns[runIndexInPropsRemote].results) {
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
          && (!this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState
          || (nextProps.remoteRuns[i].remotePipelineState.currentIteration
          !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.currentIteration
          || nextProps.remoteRuns[i].remotePipelineState.controllerState
          !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.controllerState
          || nextProps.remoteRuns[i].remotePipelineState.pipelineStep
          !== this.props.remoteRuns[runIndexInPropsRemote].remotePipelineState.pipelineStep))) {
          const run = nextProps.remoteRuns[i];

          // Update status of run in localDB
          this.props.updateLocalRun(
            run.id,
            'remotePipelineState',
            run.remotePipelineState
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
          if (nextProps.consortia[i].activePipelineId) {
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

  componentWillUnmount() {
    this.state.unsubscribeComputations();
    this.state.unsubscribeConsortia();
    this.state.unsubscribePipelines();
    this.state.unsubscribeRuns();

    ipcRenderer.removeAllListeners('docker-out');
    ipcRenderer.removeAllListeners('docker-pull-complete');
    ipcRenderer.removeAllListeners('local-run-complete');
  }

  render() {
    const { auth, children, computations, consortia, pipelines, runs } = this.props;
    const { router } = this.context;

    const childrenWithProps = React.cloneElement(children, {
      computations, consortia, pipelines, runs,
    });

    if (!auth || !auth.user.email.length) {
      return (<p>Redirecting to login...</p>);
    }

    // @TODO don't render primary content whilst still loading/bg-services
    return (
      <div className="dashboard container-fluid">
        <div className="row">
          <div className="col-xs-12 col-sm-3 navigation-pane">
            <nav className="navigation">
              <h1 className="logo text-center">
                <CoinstacAbbr />
              </h1>
              <DashboardNav auth={auth} />
              <UserAccountController push={router.push} />
            </nav>
          </div>
          <div className="col-xs-12 col-sm-9 content-pane">
            {childrenWithProps}
          </div>
        </div>
      </div>
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
  pipelines: [],
  remoteRuns: [],
  runs: [],
};

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  client: PropTypes.object.isRequired,
  computations: PropTypes.array,
  consortia: PropTypes.array,
  getCollectionFiles: PropTypes.func.isRequired,
  getDBRuns: PropTypes.func.isRequired,
  incrementRunCount: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  notifyWarning: PropTypes.func.isRequired,
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
  graphql(FETCH_ALL_USER_RUNS_QUERY, getAllAndSubProp(
    USER_RUN_CHANGED_SUBSCRIPTION,
    'remoteRuns',
    'fetchAllUserRuns',
    'subscribeToUserRuns',
    'userRunChanged',
    'userId'
  )),
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

export default connect(mapStateToProps,
  {
    getCollectionFiles,
    getLocalRun,
    getDBRuns,
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
  }
)(DashboardWithData);
