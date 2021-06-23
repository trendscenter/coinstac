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
  userId, localRuns, consortia, saveLocalRun, updateLocalRun, notifyError, notifySuccess,
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
      } else if (remoteRunsFirstFetch.error) {
        runData.status = 'error';
      }

      saveLocalRun(runData);
    });
  }, [remoteRunsFirstFetch]);

  useEffect(() => {
    if (!remoteRunChanged) return;

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
    } else if (remoteRunsFirstFetch.error) {
      runData.status = 'error';

      if (!localRun.error) {
        notifyError(`${consortium.name} Pipeline Error.`);
      }
    }

    ipcRenderer.send('clean-remote-pipeline', remoteRunChanged.id);
    saveLocalRun(runData);
  }, [remoteRunChanged]);


  // if (nextProps.remoteRuns) {
  //   // TODO: Speed this up by moving to subscription prop (n vs n^2)?
  //   for (let i = 0; i < nextProps.remoteRuns.length; i += 1) {
  //     let runIndexInLocalRuns = -1;
  //     let runIndexInPropsRemote = -1;

  //     // Find run in redux runs if it's there
  //     if (runs.length > 0) {
  //       runIndexInLocalRuns = runs
  //         .findIndex(run => run.id === nextProps.remoteRuns[i].id);
  //     }

  //     // Redux state seems to be behind a cycle, so also check component props
  //     if (runIndexInLocalRuns > -1
  //       || (runIndexInLocalRuns === -1 && !nextProps.remoteRuns[i].results
  //       && consortia.length)) {
  //       runIndexInPropsRemote = remoteRuns
  //         .findIndex(run => run.id === nextProps.remoteRuns[i].id);
  //     }

  //     if (runIndexInLocalRuns === -1 && nextProps.remoteRuns[i].results) {
  //       ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
  //       saveLocalRun({ ...nextProps.remoteRuns[i], status: 'complete' });
  //       // Not saved locally, but error signify complete
  //     } else if (runIndexInLocalRuns === -1 && nextProps.remoteRuns[i].error) {
  //       ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
  //       saveLocalRun({ ...nextProps.remoteRuns[i], status: 'error' });
  //       // Run already in props but error is incoming
  //     } else if (runIndexInLocalRuns > -1 && nextProps.remoteRuns[i].error
  //       && !runs[runIndexInLocalRuns].error && consortia.length
  //       && (!remoteRuns.length
  //         || (runIndexInPropsRemote > -1 && !remoteRuns[runIndexInPropsRemote].error)
  //       )
  //     ) {
  //       const run = nextProps.remoteRuns[i];
  //       const consortium = consortia.find(obj => obj.id === run.consortiumId);

  //       // Update status of run in localDB
  //       ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
  //       updateLocalRun(run.id, { error: run.error, status: 'error', type: run.type });
  //       notifyError(`${consortium.name} Pipeline Error.`);

  //       // Run already in props but results are incoming
  //     } else if (runIndexInLocalRuns > -1 && nextProps.remoteRuns[i].results
  //       && runIndexInPropsRemote > -1
  //       && !runs[runIndexInLocalRuns].results && consortia.length
  //       && (!remoteRuns.length
  //         || (runIndexInPropsRemote > -1 && !remoteRuns[runIndexInPropsRemote].results)
  //       )
  //     ) {
  //       const run = nextProps.remoteRuns[i];
  //       const consortium = consortia.find(obj => obj.id === run.consortiumId);

  //       // Update status of run in localDB
  //       ipcRenderer.send('clean-remote-pipeline', nextProps.remoteRuns[i].id);
  //       saveLocalRun({ ...run, status: 'complete' });
  //       notifySuccess(`${consortium.name} Pipeline Complete.`);
  //       // Looking for remote run state changes
  //     } else if (runIndexInPropsRemote > -1 && nextProps.remoteRuns[i].remotePipelineState
  //       && (!remoteRuns[runIndexInPropsRemote].remotePipelineState
  //         || (
  //           nextProps.remoteRuns[i].remotePipelineState.currentIteration
  //           !== remoteRuns[runIndexInPropsRemote].remotePipelineState.currentIteration
  //           || nextProps.remoteRuns[i].remotePipelineState.controllerState
  //           !== remoteRuns[runIndexInPropsRemote].remotePipelineState.controllerState
  //           || nextProps.remoteRuns[i].remotePipelineState.pipelineStep
  //           !== remoteRuns[runIndexInPropsRemote].remotePipelineState.pipelineStep
  //           || (!nextProps.remoteRuns[i].remotePipelineState.waitingOn
  //            && remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
  //           || (nextProps.remoteRuns[i].remotePipelineState.waitingOn
  //            && !remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn)
  //           || (nextProps.remoteRuns[i].remotePipelineState.waitingOn
  //            && remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn
  //            && nextProps.remoteRuns[i].remotePipelineState.waitingOn.length
  //            !== remoteRuns[runIndexInPropsRemote].remotePipelineState.waitingOn.length)
  //         )
  //       )
  //     ) {
  //       const run = nextProps.remoteRuns[i];

  //       // Update status of run in localDB
  //       updateLocalRun(
  //         run.id,
  //         { remotePipelineState: run.remotePipelineState }
  //       );
  //     }
  //   }
  // }
  return null;
}

const mapStateToProps = ({ runs }) => ({
  localRuns: runs.runs,
});

export default connect(mapStateToProps,
  {
    saveLocalRun,
    updateLocalRun,
    notifyError,
    notifySuccess,
  })(RemoteRunsListener);
