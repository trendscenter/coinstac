import { each } from 'lodash';
import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';

import {
  computationCompleteNotification,
  computationStartNotification,
  getRunErrorNotifier,
} from '../../utils/notifications';

export const listenToConsortia = (tia) => {
  app.core.pool.listenToConsortia(tia);
};

export const unlistenToConsortia = (tiaIds) => {
  app.core.pool.unlistenToConsortia(tiaIds);
};

export const alreadyRan = {};

/**
 * Joins a computation for which the user was not the initiator on
 * but has a project that should be run on that computation. Also checks
 * if this is the first run, if so, allows the client to join if they
 * have not started.
 *
 * @param {Object} consortium PouchDB document representing consortium
 * @param {string} consortium._id
 * @return {Promise}
 */
export const joinSlaveComputation = (consortium) => {
  const { _id: consortiumId } = consortium;
  let currentRunHist;

  return app.core.consortia.getActiveRunId(consortiumId)
  .then((runId) => {
    currentRunHist = alreadyRan[runId];
    return Promise.all([
      app.core.projects.getBy('consortiumId', consortiumId),
      runId,
      app.core.computations.shouldJoinRun(consortiumId, currentRunHist === true),
    ]);
  })
  .then(([project, runId, shouldJoinRun]) => {
    const proceedWithRun = (doRun) => {
      let runProm;
      if (doRun) {
        const onRunError = getRunErrorNotifier(consortium);

        computationStartNotification(consortium);
        app.core.pool.events.on('error', onRunError);
        app.core.pool.events.once('computation:complete', () => {
          computationCompleteNotification(consortium);
          app.core.pool.events.removeListener('error', onRunError);
        });

        if (alreadyRan[runId]) {
          runProm = app.core.computations.joinRun({
            consortiumId,
            projectId: project._id,
            runId,
          });
        } else {
          runProm = app.core.computations.joinSlavedRun({
            consortiumId,
            projectId: project._id,
            runId,
          });
        }

        alreadyRan[runId] = true;
        return runProm;
      }
    };

    if (project && runId && shouldJoinRun) {
      if (currentRunHist !== alreadyRan[consortium._id]) {
        // current hist has changed, prob not the first run now, check if we can
        // run again
        return app.core.computations
        .shouldJoinRun(consortiumId, alreadyRan[consortium._id] === true)
        .then(proceedWithRun);
      }
      return proceedWithRun(shouldJoinRun);
    }
  });
};

export const addConsortiumComputationListener = (consortium) => {
  return app.core.dbRegistry.get(`remote-consortium-${consortium._id}`)
  .syncEmitter.on('change', () => {
    joinSlaveComputation(consortium);
  });
};

/**
* Sets up the COINSTAC environment once a user is authorized (hence "Private"
* in initPrivateBackgroundServices).  Primarily, this instantiates a
* LocalPipelineRunnerPool kickoff new and existing computation runs
* @returns {function}
*/
export const initPrivateBackgroundServices = applyAsyncLoading(() => {
  return () => {
    /**
     * Listen to project changes and update the renderer's state tree.
     *
     * @todo Refactor into service? Something?
     */
    app.core.projects.initializeListeners((error) => {
      if (error) {
        app.logger.error(error);
        app.notify({
          level: 'error',
          message: `Project listener error: ${error.message}`,
        });

        // TODO: attempt to recover?
        throw error;
      }
    });
  };
});

export const teardownPrivateBackgroundServices = applyAsyncLoading(() => {
  each(alreadyRan, (value, key) => {
    alreadyRan[key] = undefined;
  });

  return () => app.core.teardown();
});

/**
 * Run a computation.
 *
 * @param {string} consortiumId Target consortium's ID. coinstac-client-core
 * uses this to determine the computation to run.
 * @param {string} projectId User's project's ID.  coinstac-client-core uses
 * this to retrieve the user's project from the dbRegistry.
 * @returns {Promise}
 */
export const runComputation = applyAsyncLoading(
  ({ consortiumId, projectId }) => {
    return () => {
      // Unfortunately, requires we `get` the document for its label
      app.core.dbRegistry.get('consortia').get(consortiumId)
        .then((consortium) => {
          const onRunError = getRunErrorNotifier(consortium);

          computationStartNotification(consortium);
          app.core.pool.events.on('error', onRunError);
          app.core.pool.events.once('computation:complete', () => {
            computationCompleteNotification(consortium);
            app.core.pool.events.removeListener('error', onRunError);
          });

          return app.core.computations.kickoff({ consortiumId, projectId });
        });
    };
  }
);
