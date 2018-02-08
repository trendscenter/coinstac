import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import DashboardNav from './dashboard-nav';
import UserAccountController from '../user/user-account-controller';
import { notifyInfo, notifySuccess, writeLog } from '../../state/ducks/notifyAndLog';
import CoinstacAbbr from '../coinstac-abbr';
import { getCollectionFiles } from '../../state/ducks/collections';
import { getLocalRun, getDBRuns, saveLocalRun } from '../../state/ducks/runs';
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
      } else {
        // this.props.initPrivateBackgroundServices();
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
        let runIndexInProps = -1;

        // Find run in local props if it's there
        if (this.props.remoteRuns.length > 0) {
          runIndexInProps = this.props.remoteRuns
            .findIndex(run => run.id === nextProps.remoteRuns[i].id);
        }

        // Run not in local props, start a pipeline (runs already filtered by member)
        if (runIndexInProps === -1 && !nextProps.remoteRuns[i].results) {
          // Save run status to localDB
          this.props.saveLocalRun({ ...nextProps.remoteRuns[i], status: 'started' });
          this.props.getCollectionFiles(nextProps.remoteRuns[i].consortiumId)
          .then((filesArray) => {
            const run = nextProps.remoteRuns[i];
            const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);
            const pipeline =
              this.props.pipelines.find(obj => obj.id === consortium.activePipelineId);

            if (filesArray.error) {
              filesArray = [];
            }

            // 5 second timeout to ensure no port conflicts in
            //   development env between remote and client pipelines
            setTimeout(() => {
              this.props.notifyInfo({
                message: `Decentralized Pipeline Starting for ${consortium.name}.`,
              });
              ipcRenderer.send('start-pipeline', { consortium, pipeline, filesArray, run });
            }, 5000);
          });
        } else if (runIndexInProps === -1 && nextProps.remoteRuns[i].results) {
          this.props.saveLocalRun({ ...nextProps.remoteRuns[i], status: 'complete' });
        // Run already in props but results are incoming
        } else if (runIndexInProps > -1 && nextProps.remoteRuns[i].results
          && !this.props.remoteRuns[runIndexInProps].results) {
          const run = nextProps.remoteRuns[i];
          const consortium = this.props.consortia.find(obj => obj.id === run.consortiumId);

          // Update status of run in localDB
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
        }
      }
    }

    if (nextProps.consortia && this.props.consortia.length > 0) {
      for (let i = 0; i < nextProps.consortia.length; i += 1) {
        if (this.props.consortia[i] && nextProps.consortia[i].id === this.props.consortia[i].id &&
            nextProps.consortia[i].activePipelineId &&
            !this.props.consortia[i].activePipelineId &&
            nextProps.consortia[i].members.indexOf(user.id) > -1) {
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
          break;
        }
      }
    }
  }

  componentWillUnmount() {
    this.state.unsubscribeComputations();
    this.state.unsubscribeConsortia();
    this.state.unsubscribePipelines();
    this.state.unsubscribeRuns();
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
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
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
    notifyInfo,
    notifySuccess,
    pullComputations,
    saveLocalRun,
    updateDockerOutput,
    updateUserConsortiaStatuses,
    writeLog,
  }
)(DashboardWithData);
