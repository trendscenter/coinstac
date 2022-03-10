import { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useQuery, useSubscription } from '@apollo/client';
import { ipcRenderer } from 'electron';
import { get } from 'lodash';

import { FETCH_ALL_USER_RUNS_QUERY, USER_RUN_CHANGED_SUBSCRIPTION } from '../../../state/graphql/functions';
import { saveLocalRun, updateLocalRun } from '../../../state/ducks/runs';
import { notifyError, notifySuccess } from '../../../state/ducks/notifyAndLog';

function runIsFinished(run) {
  return run.error || run.results;
}

function RemoteRunsListener({
  userId,
  localRuns,
  consortia,
  saveLocalRun,
  updateLocalRun,
  suspendedRuns,
  notifyError,
  notifySuccess,
}) {
  const ranFirstQuery = useRef(false);

  const { data } = useQuery(FETCH_ALL_USER_RUNS_QUERY, {
    variables: { userId },
    skip: ranFirstQuery.current,
  });
  const { data: subscriptionData } = useSubscription(USER_RUN_CHANGED_SUBSCRIPTION, {
    variables: { userId },
  });

  const remoteRunsFirstFetch = get(data, 'fetchAllUserRuns');
  const remoteRunChanged = get(subscriptionData, 'userRunChanged');

  useEffect(() => {
    if (!remoteRunsFirstFetch) return;

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

      saveLocalRun(runData);
    });
  }, [remoteRunsFirstFetch]);

  useEffect(() => {
    if (!remoteRunChanged) return;

    if (remoteRunChanged.delete) {
      // TODO: call redux action to delete run
      return;
    }

    const localRun = localRuns.find(r => r.id === remoteRunChanged.id);

    if (!runIsFinished(remoteRunChanged)) {
      updateLocalRun(remoteRunChanged.id, {
        remotePipelineState: remoteRunChanged.remotePipelineState,
      });

      return;
    }

    const runData = { ...remoteRunChanged };

    const consortium = consortia.find(obj => obj.id === remoteRunChanged.consortiumId);

    if (remoteRunChanged.results) {
      runData.status = 'complete';

      if (!localRun.results) {
        notifySuccess(`${consortium.name} Pipeline Complete.`);
      }
    } else if (remoteRunChanged.error) {
      runData.status = 'error';

      if (!localRun.error) {
        notifyError(`${consortium.name} Pipeline Error.`);
      }
    }

    ipcRenderer.send('clean-remote-pipeline', remoteRunChanged.id);
    saveLocalRun(runData);
  }, [remoteRunChanged]);

  return null;
}

const mapStateToProps = ({ runs, suspendedRuns }) => ({
  localRuns: runs.runs,
  suspendedRuns,
});

export default connect(mapStateToProps,
  {
    saveLocalRun,
    updateLocalRun,
    notifyError,
    notifySuccess,
  })(RemoteRunsListener);
