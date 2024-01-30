import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useSubscription } from '@apollo/client';
import { ipcRenderer } from 'electron';
import { get } from 'lodash';

import { FETCH_ALL_USER_RUNS_QUERY, USER_RUN_CHANGED_SUBSCRIPTION } from '../../../state/graphql/functions';
import {
  loadLocalRuns, saveRunLocally, updateRunLocally, deleteRun,
} from '../../../state/ducks/runs';
import { notifyError, notifySuccess } from '../../../state/ducks/notifyAndLog';

function runIsFinished(run) {
  return run.error || run.results;
}

function RemoteRunsListener({
  userId,
  consortia,
}) {
  const localRuns = useSelector(state => state.runs.runs);
  const suspendedRuns = useSelector(state => state.suspendedRuns);

  const dispatch = useDispatch();

  const ranFirstQuery = useRef(false);

  const { data } = useQuery(FETCH_ALL_USER_RUNS_QUERY, {
    variables: { userId },
    skip: ranFirstQuery.current,
    onError: (error) => {
      /* eslint-disable-next-line no-console */
      console.error({ error });
    },
  });
  const { data: subscriptionData } = useSubscription(USER_RUN_CHANGED_SUBSCRIPTION, {
    variables: { userId },
  });

  const remoteRunsFirstFetch = get(data, 'fetchAllUserRuns');
  const remoteRunChanged = get(subscriptionData, 'userRunChanged');

  useEffect(() => {
    if (!remoteRunsFirstFetch) return;

    dispatch(loadLocalRuns());

    ranFirstQuery.current = true;

    remoteRunsFirstFetch.forEach((remoteRun) => {
      const runData = { ...remoteRun };

      if (remoteRun.results) {
        runData.status = 'complete';
      } else if (remoteRun.error) {
        runData.status = 'error';
      } else if (remoteRun.id in suspendedRuns) {
        runData.status = 'suspended';
      }

      dispatch(saveRunLocally(runData));
    });
  }, [remoteRunsFirstFetch]);

  useEffect(() => {
    if (!remoteRunChanged) return;

    if (remoteRunChanged.delete) {
      dispatch(deleteRun(remoteRunChanged.id));
      return;
    }

    const localRun = localRuns.find(r => r.id === remoteRunChanged.id);

    // Current user is not part of the run, but is part of the consortium
    if (!localRun) {
      dispatch(saveRunLocally(remoteRunChanged));
    }

    if (!runIsFinished(remoteRunChanged)) {
      dispatch(updateRunLocally(remoteRunChanged.id, {
        remotePipelineState: remoteRunChanged.remotePipelineState,
      }));

      return;
    }

    const runData = { ...remoteRunChanged };

    const consortium = consortia.find(obj => obj.id === remoteRunChanged.consortiumId);

    if (remoteRunChanged.results) {
      runData.status = 'complete';

      if (!localRun.results) {
        dispatch(notifySuccess(`${consortium.name} Pipeline Complete.`));
      }
    } else if (remoteRunChanged.error) {
      runData.status = 'error';

      if (!localRun.error) {
        dispatch(notifyError(`${consortium.name} Pipeline Error.`));
      }
    }

    ipcRenderer.send('clean-remote-pipeline', remoteRunChanged.id);
    dispatch(saveRunLocally(runData));
  }, [remoteRunChanged]);

  return null;
}

export default RemoteRunsListener;
