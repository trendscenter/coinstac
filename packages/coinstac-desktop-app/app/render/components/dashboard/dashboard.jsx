/* eslint-disable no-console */
import { ApolloProvider, useQuery } from '@apollo/client';
import { ApolloProvider as ApolloHOCProvider } from '@apollo/react-hoc';
import { List, ListItem } from '@material-ui/core';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { ipcRenderer } from 'electron';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, {
  useEffect, useMemo, useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router';

import useContainerStatus from '../../hooks/useContainerStatus';
import useApolloClient from '../../state/apollo-client';
import {
  refreshToken,
  setContainerService,
  toggleTutorial,
  tutorialChange,
} from '../../state/ducks/auth';
import { notifyError } from '../../state/ducks/notifyAndLog';
import {
  COMPUTATION_CHANGED_SUBSCRIPTION,
  CONSORTIUM_CHANGED_SUBSCRIPTION,
  FETCH_ALL_COMPUTATIONS_QUERY,
  FETCH_ALL_CONSORTIA_QUERY,
  FETCH_ALL_PIPELINES_QUERY,
  FETCH_ALL_THREADS_QUERY,
  FETCH_ALL_USER_RUNS_QUERY,
  PIPELINE_CHANGED_SUBSCRIPTION,
  THREAD_CHANGED_SUBSCRIPTION,
  USER_RUN_CHANGED_SUBSCRIPTION,
} from '../../state/graphql/functions';
import useEntityListSubscription from '../../utils/effects/use-entity-list-subscription';
import CoinstacAbbr from '../coinstac-abbr';
import useSelectRunsOfInterest from '../runs/effects/useSelectRunsOfInterest';
import useStartDecentralizedRun from '../runs/effects/useStartDecentralizedRun';
import useStartInitialRuns from '../runs/effects/useStartInitialRuns';
import UserAccountController from '../user/user-account-controller';
import ContainerStatus from './container-status';
import DashboardNav from './dashboard-nav';
import DashboardTutorialModal from './dashboard-tutorial';
import DockerEventsListeners from './listeners/docker-events-listeners';
import LocalRunStatusListeners from './listeners/local-run-status-listeners';
import LogListener from './listeners/log-listener';
import NotificationsListener from './listeners/notifications-listener';
import PullComputationsListener from './listeners/pull-computations-listener';
import RemoteRunsListener from './listeners/remote-runs-listener';
import TreeviewListener from './listeners/treeview-listener';
import UpdateDataMapStatusStartupListener from './listeners/update-data-map-status-startup-listener';
import UserPermissionsListener from './listeners/user-permissions-listener';

function Dashboard({
  children,
  router,
  client,
}) {
  const auth = useSelector(state => state.auth);
  const runs = useSelector(state => state.runs.runs);
  const maps = useSelector(state => state.maps.consortiumDataMappings);

  const dispatch = useDispatch();

  const { containerService } = auth;

  const [showTutorialModal, setShowTutorialModal] = useState(!auth.isTutorialHidden);

  const {
    data: consortiaData, subscribeToMore: subscribeToConsortia, refetch: refetchConsortia,
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

  useEntityListSubscription(subscribeToConsortia, CONSORTIUM_CHANGED_SUBSCRIPTION, 'fetchAllConsortia', 'consortiumChanged', undefined, refetchConsortia);
  useEntityListSubscription(subscribeToComputations, COMPUTATION_CHANGED_SUBSCRIPTION, 'fetchAllComputations', 'computationChanged');
  useEntityListSubscription(subscribeToPipelines, PIPELINE_CHANGED_SUBSCRIPTION, 'fetchAllPipelines', 'pipelineChanged');
  useEntityListSubscription(subscribeToThreads, THREAD_CHANGED_SUBSCRIPTION, 'fetchAllThreads', 'threadChanged');
  useEntityListSubscription(subscribeToUserRuns, USER_RUN_CHANGED_SUBSCRIPTION, 'fetchAllUserRuns', 'userRunChanged', { userId: auth.user.id });

  useEffect(() => {
    ipcRenderer.send('load-initial-log');
    ipcRenderer.on('main-error', (event, arg) => {
      dispatch(notifyError(`Unexpected error: ${arg.message || arg.error.message || arg}`));
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

  const containerStatus = useContainerStatus();

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
    [threads],
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
      dispatch(toggleTutorial());
    }
  };

  const handleSelectContainerService = () => {
    dispatch(setContainerService(
      containerService === 'docker' ? 'singularity' : 'docker',
    ));
  };

  const childrenWithProps = React.cloneElement(children, {
    computations, consortia, pipelines, runs, threads, containerStatus,
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
          isTutorialHidden={auth.isTutorialHidden}
          tutorialChange={data => dispatch(tutorialChange(data))}
        />
        <List>
          <ListItem>
            <UserAccountController
              unreadThreadCount={unreadThreadsCount}
            />
          </ListItem>
          <ListItem>
            <ContainerStatus
              status={containerStatus}
              containerService={containerService}
              onChangeContainerService={handleSelectContainerService}
            />
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
      <PullComputationsListener userId={auth.user.id} containerStatus={containerStatus} />
      <RemoteRunsListener userId={auth.user.id} consortia={consortia} />
      <UserPermissionsListener userId={auth.user.id} client={client} />
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
  client: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  router: PropTypes.object.isRequired,
};

function ConnectedDashboard(props) {
  const [apolloClient, setApolloClient] = useApolloClient();

  useEffect(() => {
    ipcRenderer.on('refresh-token', () => {
      refreshToken();
      apolloClient.client.stop();
      apolloClient.wsLink.subscriptionClient.close();
      setApolloClient();
    });
    // client is initialy null, get a new client w the proper token
    if (!apolloClient) {
      setApolloClient();
    }
    return () => {
      ipcRenderer.removeAllListeners('refresh-token');
      if (!apolloClient) return;
      apolloClient.client.stop();
      apolloClient.wsLink.subscriptionClient.close();
    };
  }, [apolloClient]);

  return (apolloClient
    && (
      <ApolloProvider client={apolloClient.client}>
        <ApolloHOCProvider client={apolloClient.client}>
          <Dashboard {...props} client={apolloClient.client} />
        </ApolloHOCProvider>
      </ApolloProvider>
    )
  );
}

const connectedComponent = withRouter(ConnectedDashboard);

export default connectedComponent;
