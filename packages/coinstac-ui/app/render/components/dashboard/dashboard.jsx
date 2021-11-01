import React, { useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { useQuery, ApolloProvider } from '@apollo/client';
import { ApolloProvider as ApolloHOCProvider } from '@apollo/react-hoc';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { ipcRenderer, remote } from 'electron';
import { List, ListItem } from '@material-ui/core';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';

import UserAccountController from '../user/user-account-controller';
import CoinstacAbbr from '../coinstac-abbr';
import getApolloClient from '../../state/apollo-client';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  FETCH_ALL_THREADS_QUERY,
  PIPELINE_CHANGED_SUBSCRIPTION,
  USER_RUN_CHANGED_SUBSCRIPTION,
  THREAD_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import DashboardNav from './dashboard-nav';
import DashboardPipelineNavBar from './dashboard-pipeline-nav-bar';
import DockerStatus from './docker-status';

import useEntityListSubscription from '../../utils/effects/use-entity-list-subscription';
import useDockerStatus from './effects/useDockerStatus';
import StartPipelineListener from './listeners/start-pipeline-listener';
import NotificationsListener from './listeners/notifications-listener';
import DockerEventsListeners from './listeners/docker-events-listeners';
import LocalRunStatusListeners from './listeners/local-run-status-listeners';
import LogListener from './listeners/log-listener';
import UpdateDataMapStatusStartupListener from './listeners/update-data-map-status-startup-listener';
import PullComputationsListener from './listeners/pull-computations-listener';
import RemoteRunsListener from './listeners/remote-runs-listener';
import UserPermissionsListener from './listeners/user-permissions-listener';
import TreeviewListener from './listeners/treeview-listener';

function Dashboard({
  auth, children, runs, maps, router, hideTutorial,
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

  useEntityListSubscription(subscribeToConsortia, CONSORTIUM_CHANGED_SUBSCRIPTION, 'fetchAllConsortia', 'consortiumChanged');
  useEntityListSubscription(subscribeToComputations, COMPUTATION_CHANGED_SUBSCRIPTION, 'fetchAllComputations', 'computationChanged');
  useEntityListSubscription(subscribeToPipelines, PIPELINE_CHANGED_SUBSCRIPTION, 'fetchAllPipelines', 'pipelineChanged');
  useEntityListSubscription(subscribeToThreads, THREAD_CHANGED_SUBSCRIPTION, 'fetchAllThreads', 'threadChanged');
  useEntityListSubscription(subscribeToUserRuns, USER_RUN_CHANGED_SUBSCRIPTION, 'fetchAllUserRuns', 'userRunChanged', { userId: auth.user.id });

  useEffect(() => {
    ipcRenderer.send('load-initial-log');
  }, []);

  useEffect(() => {
    const email = get(auth, 'user.email');

    if (!email) {
      router.push('/login');
    }
  }, [auth]);

  const consortia = get(consortiaData, 'fetchAllConsortia');
  const computations = get(computationData, 'fetchAllComputations');
  const pipelines = get(pipelinesData, 'fetchAllPipelines');
  const threads = get(threadsData, 'fetchAllThreads');
  const remoteRuns = get(userRunsData, 'fetchAllUserRuns');

  const dockerStatus = useDockerStatus();

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

  function goBack() {
    if (!canShowBackButton) return;

    const { locationStacks } = auth;

    router.push(locationStacks[locationStacks.length - 2]);
  }

  const childrenWithProps = React.cloneElement(children, {
    computations, consortia, pipelines, runs, threads, dockerStatus,
  });

  if (!get(auth, 'user.email')) {
    return (<p>Redirecting to login...</p>);
  }

  return (
    <div className="dashboard">
      <div className="dashboard-nav">
        <CoinstacAbbr />
        <DashboardNav user={auth.user} hideTutorial={hideTutorial} />
        <List>
          <ListItem>
            <UserAccountController
              unreadThreadCount={unreadThreadsCount}
            />
          </ListItem>
          <ListItem>
            <DockerStatus status={dockerStatus} />
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
              onClick={goBack}
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
      <RemoteRunsListener userId={auth.user.id} consortia={consortia} />
      <UserPermissionsListener userId={auth.user.id} />
      <TreeviewListener
        userId={auth.user.id}
        appDirectory={auth.appDirectory}
        runs={runs}
        consortia={consortia}
      />
    </div>
  );
}

Dashboard.displayName = 'Dashboard';

Dashboard.defaultProps = {
  runs: [],
  maps: [],
};

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  runs: PropTypes.array,
  maps: PropTypes.array,
  router: PropTypes.object.isRequired,
  hideTutorial: PropTypes.bool.isRequired,
};

const clientConfig = remote.getGlobal('config');

function ConnectedDashboard(props) {
  const apolloClient = useRef(null);

  useEffect(() => {
    return () => {
      if (!apolloClient.current) return;

      apolloClient.current.client.stop();
      apolloClient.current.wsLink.subscriptionClient.close();
      apolloClient.current = null;
    };
  }, []);

  if (!apolloClient.current) {
    apolloClient.current = getApolloClient(clientConfig);
  }

  return (
    <ApolloProvider client={apolloClient.current.client}>
      <ApolloHOCProvider client={apolloClient.current.client}>
        <Dashboard {...props} />
      </ApolloHOCProvider>
    </ApolloProvider>
  );
}

const mapStateToProps = ({ auth, runs, maps }) => ({
  auth,
  runs: runs.runs,
  maps: maps.consortiumDataMappings,
  hideTutorial: auth.hideTutorial,
});

const connectedComponent = connect(mapStateToProps)(withRouter(ConnectedDashboard));

export default connectedComponent;
