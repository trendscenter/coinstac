import { connect } from 'react-redux';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { List, ListItem } from '@material-ui/core';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';

import UserAccountController from '../user/user-account-controller';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from '../../state/ducks/notifyAndLog';
import CoinstacAbbr from '../coinstac-abbr';
import { saveLocalRun, updateLocalRun } from '../../state/ducks/runs';
import { updateUserPerms } from '../../state/ducks/auth';
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
  FETCH_USER_QUERY,
} from '../../state/graphql/functions';
import DashboardNav from './dashboard-nav';
import DashboardPipelineNavBar from './dashboard-pipeline-nav-bar';
import DockerStatusChecker from './docker-status-checker';

import subscribeToEntityList from './effects/subscribe-to-entity-list';
import StartPipelineListener from './listeners/start-pipeline-listener';
import NotificationsListener from './listeners/notifications-listener';
import DockerEventsListeners from './listeners/docker-events-listeners';
import LocalRunStatusListeners from './listeners/local-run-status-listeners';
import LogListener from './listeners/log-listener';
import UpdateDataMapStatusStartupListener from './listeners/update-data-map-status-startup-listener';
import PullComputationsListener from './listeners/pull-computations-listener';

function Dashboard({
  auth, children, runs, maps,
}) {
  const {
    data: consortiaData, subscribeToMore: subscribeToConsortia,
  } = useQuery(FETCH_ALL_CONSORTIA_QUERY);
  const {
    data: computationData, subscribeToMore: subscribeToComputations,
  } = useQuery(FETCH_ALL_COMPUTATIONS_QUERY);
  const {
    data: pipelinesData, subscribeToMore: subscribeToPipelines,
  } = useQuery(FETCH_ALL_PIPELINES_QUERY);
  const {
    data: threadsData, subscribeToMore: subscribeToThreads,
  } = useQuery(FETCH_ALL_THREADS_QUERY);
  const {
    data: userRunsData, subscribeToMore: subscribeToUserRuns,
  } = useQuery(FETCH_ALL_USER_RUNS_QUERY);

  subscribeToEntityList(subscribeToConsortia, CONSORTIUM_CHANGED_SUBSCRIPTION, 'fetchAllConsortia', 'consortiumChanged');
  subscribeToEntityList(subscribeToComputations, COMPUTATION_CHANGED_SUBSCRIPTION, 'fetchAllComputations', 'computationChanged');
  subscribeToEntityList(subscribeToPipelines, PIPELINE_CHANGED_SUBSCRIPTION, 'fetchAllPipelines', 'pipelineChanged');
  subscribeToEntityList(subscribeToThreads, THREAD_CHANGED_SUBSCRIPTION, 'fetchAllThreads', 'threadChanged');
  subscribeToEntityList(subscribeToUserRuns, USER_RUN_CHANGED_SUBSCRIPTION, 'fetchAllUserRuns', 'userRunChanged');

  useEffect(() => {
    ipcRenderer.send('load-initial-log');
  }, []);

  const consortia = get(consortiaData, 'fetchAllConsortia');
  const computations = get(computationData, 'fetchAllComputations');
  const pipelines = get(pipelinesData, 'fetchAllPipelines');
  const threads = get(threadsData, 'fetchAllThreads');
  const remoteRuns = get(userRunsData, 'fetchAllUserRuns');

  const unreadThreadsCount = useMemo(
    () => {
      if (!threads) return 0;
      return threads
        .filter(thread => auth.user.id in thread && !thread[auth.user.id].isRead)
        .length;
    },
    [threads]
  );

  const canShowBackButton = auth.locationStacks.length > 1;

  const childrenWithProps = React.cloneElement(children, {
    computations, consortia, pipelines, runs, threads,
  });

  if (!get(auth, 'user.email')) {
    return (<p>Redirecting to login...</p>);
  }

  return (
    <div className="dashboard">
      <div className="dashboard-nav">
        <CoinstacAbbr />
        <DashboardNav user={auth.user} />
        <List>
          <ListItem>
            <UserAccountController
              unreadThreadCount={unreadThreadsCount}
            />
          </ListItem>
          <ListItem>
            <DockerStatusChecker />
          </ListItem>
        </List>
      </div>
      <div className="dashboard-content">
        <DashboardPipelineNavBar consortia={consortia} localRuns={runs} />
        <main className="content-pane">
          {canShowBackButton && (
            <button
              type="button"
              className="back-button"
              onClick={() => {}}
            >
              <ArrowUpwardIcon className="arrow-icon" />
            </button>
          )}
          {childrenWithProps}
        </main>
      </div>
      <StartPipelineListener
        consortia={consortia}
        remoteRuns={remoteRuns}
      />
      <NotificationsListener />
      <LocalRunStatusListeners />
      <DockerEventsListeners />
      <LogListener />
      <UpdateDataMapStatusStartupListener maps={maps} consortia={consortia} userId={auth.user.id} />
      <PullComputationsListener userId={auth.user.id} />
    </div>
  );
}

Dashboard.displayName = 'Dashboard';

Dashboard.contextTypes = {
  router: PropTypes.object.isRequired,
};

Dashboard.defaultProps = {
  runs: [],
  maps: [],
  currentUser: null,
};

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  currentUser: PropTypes.object,
  runs: PropTypes.array,
  maps: PropTypes.array,
  notifyError: PropTypes.func.isRequired,
  notifyInfo: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  saveLocalRun: PropTypes.func.isRequired,
  updateLocalRun: PropTypes.func.isRequired,
  updateUserPerms: PropTypes.func.isRequired,
};

const mapStateToProps = ({ auth, runs, maps }) => ({
  auth,
  runs: runs.runs,
  maps: maps.consortiumDataMappings,
});

const connectedComponent = connect(mapStateToProps,
  {
    notifyError,
    notifyInfo,
    notifySuccess,
    saveLocalRun,
    updateLocalRun,
    updateUserPerms,
  })(Dashboard);

export default connectedComponent;
