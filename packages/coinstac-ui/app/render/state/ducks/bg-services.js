import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';
import { updateConsortia } from './consortia';
import { updateComputations } from './computations';
import cloneDeep from 'lodash/cloneDeep';

export const listenToConsortia = (tia) => {
  app.core.pool.listenToConsortia(tia);
};

export const unlistenToConsortia = (tiaIds) => {
  app.core.pool.unlistenToConsortia(tiaIds);
};

/**
 * Sets up the COINSTAC environment once a user is authorized (hence "Private"
 * in initPrivateBackgroundServices).  Primarily, this instantiates a
 * LocalPipelineRunnerPool kickoff new and existing computation runs
 * @returns {function}
 */
export const initPrivateBackgroundServices = applyAsyncLoading(
  function initPrivateBackgroundServices() {
    return (dispatch) => { // eslint-disable-line
      // set background event listeners
      // @NOTE: "change" document shape differences in computations & consortia attributed
      // to different replication configs (e.g. sync both dirs vs sync on dir)
      const tiaDB = app.core.dbRegistry.get('consortia');
      tiaDB.syncEmitter.on('change', (change) => {
        const toUpdate = change.change.docs.map((changed) => {
          const cloned = cloneDeep(changed); // de-ref main memory
          delete cloned._revisions; // gross. pouchy maybe can save the day?
          return cloned;
        });
        updateConsortia({ dispatch, toUpdate, isBg: true });
      });
      const compsDB = app.core.dbRegistry.get('computations');
      compsDB.syncEmitter.on('change', (change) => {
        const toUpdate = change.docs.map((changed) => {
          const cloned = cloneDeep(changed); // de-ref main memory
          delete cloned._revisions; // gross. pouchy maybe can save the day?
          return cloned;
        });
        updateComputations({ dispatch, toUpdate, isBg: true });
      });
      return Promise.all([
        tiaDB.all().then((docs) => updateConsortia({ dispatch, toUpdate: docs, isBg: true })),
        compsDB.all().then((docs) => updateComputations({ dispatch, toUpdate: docs, isBg: true })),
      ]);
    };
  }
);

export const teardownPrivateBackgroundServices = applyAsyncLoading(
  function teardownPrivateBackgroundServices() {
    return (dispatch) => app.core.teardown(); // eslint-disable-line
  }
);

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
  function runComputationBackgroundService({ consortiumId, projectId }) {
    return dispatch => {
      return app.core.computations.kickoff({ consortiumId, projectId });
    };
  }
);
