import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router';
import { useQuery, ApolloProvider } from '@apollo/client';
import { ApolloProvider as ApolloHOCProvider } from '@apollo/react-hoc';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { List, ListItem } from '@material-ui/core';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';

import UserAccountController from '../user/user-account-controller';
import CoinstacAbbr from '../coinstac-abbr';
import getApolloClient from '../../state/apollo-client';
import { togglePipelineTutorial, pipelineTutorialChange } from '../../state/ducks/auth';
import { notifyError } from '../../state/ducks/notifyAndLog';
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
import useDockerStatus from '../../hooks/useDockerStatus';
import useEntityListSubscription from '../../utils/effects/use-entity-list-subscription';
import DashboardNav from './dashboard-nav';
import DashboardTutorialModal from './dashboard-tutorial';
import DockerStatus from './docker-status';
import NotificationsListener from './listeners/notifications-listener';
import DockerEventsListeners from './listeners/docker-events-listeners';
import LocalRunStatusListeners from './listeners/local-run-status-listeners';
import LogListener from './listeners/log-listener';
import UpdateDataMapStatusStartupListener from './listeners/update-data-map-status-startup-listener';
import PullComputationsListener from './listeners/pull-computations-listener';
import RemoteRunsListener from './listeners/remote-runs-listener';
import UserPermissionsListener from './listeners/user-permissions-listener';
import TreeviewListener from './listeners/treeview-listener';
import useStartInitialRuns from '../runs/effects/useStartInitialRuns';
import useStartDecentralizedRun from '../runs/effects/useStartDecentralizedRun';
import useSelectRunsOfInterest from '../runs/effects/useSelectRunsOfInterest';

function Dashboard({
  children,
  router,
}) {
  const auth = useSelector(state => state.auth);
  const runs = useSelector(state => state.runs.runs);
  const maps = useSelector(state => state.maps.consortiumDataMappings);

  const dispatch = useDispatch();

  const [showTutorialModal, setShowTutorialModal] = useState(auth.showPipelineTutorial);

  const {
    data: consortiaData, subscribeToMore: subscribeToConsortia,
  } = useQuery(FETCH_ALL_CONSORTIA_QUERY, {
    onError: (error) => { console.error({ error }); },
  });
  const {
    data: computationData, subscribeToMore: subscribeToComputations,
  } = useQuery(FETCH_ALL_COMPUTATIONS_QUERY, {
    onError: (error) => { console.error({ error }); },
  });
  const {
    data: pipelinesData, subscribeToMore: subscribeToPipelines,
  } = useQuery(FETCH_ALL_PIPELINES_QUERY, {
    onError: (error) => { console.error({ error }); },
  });
  const {
    data: threadsData, subscribeToMore: subscribeToThreads,
  } = useQuery(FETCH_ALL_THREADS_QUERY, {
    onError: (error) => { console.error({ error }); },
  });
  const { subscribeToMore: subscribeToUserRuns } = useQuery(FETCH_ALL_USER_RUNS_QUERY, {
    onError: (error) => { console.error({ error }); },
  });

  useEntityListSubscription(subscribeToConsortia, CONSORTIUM_CHANGED_SUBSCRIPTION, 'fetchAllConsortia', 'consortiumChanged');
  useEntityListSubscription(subscribeToComputations, COMPUTATION_CHANGED_SUBSCRIPTION, 'fetchAllComputations', 'computationChanged');
  useEntityListSubscription(subscribeToPipelines, PIPELINE_CHANGED_SUBSCRIPTION, 'fetchAllPipelines', 'pipelineChanged');
  useEntityListSubscription(subscribeToThreads, THREAD_CHANGED_SUBSCRIPTION, 'fetchAllThreads', 'threadChanged');
  useEntityListSubscription(subscribeToUserRuns, USER_RUN_CHANGED_SUBSCRIPTION, 'fetchAllUserRuns', 'userRunChanged', { userId: auth.user.id });

  useEffect(() => {
    ipcRenderer.send('load-initial-log');
    ipcRenderer.on('main-error', (event, arg) => {
      dispatch(notifyError(`Unexpected error: ${arg.message || arg.error || arg}`));
    });
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

  const dockerStatus = useDockerStatus();

  useStartInitialRuns(); // starts pipelines on app startup
  useStartDecentralizedRun(); // starts decentralized runs when the api server sends a subscription

  const runsOfInterestInProgress = useSelectRunsOfInterest(72, 'started');

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

  const handleGoBack = () => {
    if (!canShowBackButton) return;

    const { locationStacks } = auth;

    router.push(locationStacks[locationStacks.length - 2]);
  };

  const handleCloseModal = (neverShow) => {
    setShowTutorialModal(false);

    if (neverShow) {
      dispatch(togglePipelineTutorial());
    }
  };

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
        <DashboardNav
          user={auth.user}
          hasRunOfInterestInProgress={Boolean(runsOfInterestInProgress.length)}
          showPipelineTutorial={auth.showPipelineTutorial}
          pipelineTutorialChange={data => dispatch(pipelineTutorialChange(data))}
        />
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
        <main className="content-pane">
          {canShowBackButton && (
            <button
              type="button"
              className="back-button"
              onClick={handleGoBack}
            >
              <ArrowUpwardIcon className="arrow-icon" />
            </button>
          )}
          {childrenWithProps}
        </main>
      </div>
      <NotificationsListener />
      <LocalRunStatusListeners />
      <DockerEventsListeners />
      <LogListener />
      <UpdateDataMapStatusStartupListener maps={maps} consortia={consortia} userId={auth.user.id} />
      <PullComputationsListener userId={auth.user.id} dockerStatus={dockerStatus} />
      <RemoteRunsListener userId={auth.user.id} consortia={consortia} />
      <UserPermissionsListener userId={auth.user.id} />
      <TreeviewListener
        userId={auth.user.id}
        appDirectory={auth.appDirectory}
        runs={runs}
        consortia={consortia}
      />
      <DashboardTutorialModal open={showTutorialModal} onClose={handleCloseModal} />
    </div>
  );
}

Dashboard.displayName = 'Dashboard';

Dashboard.propTypes = {
  children: PropTypes.node.isRequired,
  router: PropTypes.object.isRequired,
};

const { apiServer, subApiServer } = window.config;

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
    apolloClient.current = getApolloClient({ apiServer, subApiServer });
  }

  return (
    <ApolloProvider client={apolloClient.current.client}>
      <ApolloHOCProvider client={apolloClient.current.client}>
        <Dashboard {...props} />
      </ApolloHOCProvider>
    </ApolloProvider>
  );
}

const connectedComponent = withRouter(ConnectedDashboard);

export default connectedComponent;
