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
      app.core.dbRegistry.get('consortia').syncEmitter.on('change', (change) => {
        const toUpdate = change.change.docs.map((changed) => {
          const cloned = cloneDeep(changed); // de-ref main memory
          delete cloned._revisions; // gross. pouchy maybe can save the day?
          return cloned;
        });
        updateConsortia({ dispatch, toUpdate, isBg: true });
      });
      app.core.dbRegistry.get('computations').syncEmitter.on('change', (change) => {
        const toUpdate = change.docs.map((changed) => {
          const cloned = cloneDeep(changed); // de-ref main memory
          delete cloned._revisions; // gross. pouchy maybe can save the day?
          return cloned;
        });
        updateComputations({ dispatch, toUpdate, isBg: true });
      });
    };
  }
);

export const teardownPrivateBackgroundServices = applyAsyncLoading(
  function teardownPrivateBackgroundServices() {
    return (dispatch) => app.core.teardown(); // eslint-disable-line
  }
);
