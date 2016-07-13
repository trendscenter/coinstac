import app from 'ampersand-app';
import { applyAsyncLoading } from './loading';
import { updateConsortia } from './consortia';
import { updateComputations } from './computations';
import cloneDeep from 'lodash/cloneDeep';
import map from 'lodash/map';
import { hashHistory } from 'react-router';

export const listenToConsortia = (tia) => {
  app.core.pool.listenToConsortia(tia);
};

export const unlistenToConsortia = (tiaIds) => {
  app.core.pool.unlistenToConsortia(tiaIds);
};

/**
 * Joins a computation for which the user was not the initiator on
 * but has a project that should be run on that computation
 * @param  Object consortium pouchy instance
 * @return undefined
 */
const joinSlaveComputation = (consortium) => {
  app.core.dbRegistry.get(`local-consortium-${consortium._id}`).all()
  .then(docs => {
    const appUser = app.core.auth.getUser().username;
    const compIds = map(docs, (doc) => {
      return doc._id.replace(`-${appUser}`, '');
    });
    return app.core.dbRegistry.get(`remote-consortium-${consortium._id}`)
    .find({
      selector: { complete: { $ne: true } },
    })
    .then(remoteDocs => {
      // filter out already ran (by user) computations
      // done here as find() can't use $nin on _id
      return remoteDocs.filter(doc => compIds.indexOf(doc._id) === -1);
    });
  })
  .then(compRuns => {
    const mappedRuns = map(compRuns, (run) => {
      return { [run.consortiumId]: run._id };
    });
    app.core.dbRegistry.get('projects').find({
      selector: { consortiumId: { $in: mappedRuns.keys() } },
    }).then(projects => (
      projects.forEach(project => {
        app.core.computations.joinRun(
          {
            consortiumId: project.consortiumId,
            projectId: project._Id,
            runId: mappedRuns[project.consortiumId],
          }
        );
      })
    ));
  });
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
      const appUser = app.core.auth.getUser().username;
      app.core.consortia.getUserConsortia(appUser)
      .then(userConsortia => {
        userConsortia.forEach(consortium => {
          // this is called twice, once on startup
          // second time inside change listener
          joinSlaveComputation(consortium)
          app.core.dbRegistry.get(`remote-consortium-${consortium._id}`)
          .syncEmitter.on('change', change => {
            joinSlaveComputation(consortium)
          });
        });
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
      // Unfortunately, requires we `get` the document for its label
      app.core.dbRegistry.get('consortia').get(consortiumId)
        .then(consortium => {
          /**
           * Add notifications for computation runs and completion.
           *
           * @todo Consider moving the notifications to a better location.
           */
          function runError(error) {
            app.notifications.push({
              autoDismiss: 1,
              level: 'error',
              message: `Error running computation for “${consortium.label}”: ${error.message}`,
            });
          }
          function runEnd() {
            app.notifications.push({
              autoDismiss: 1,
              level: 'info',
              message: `Ran computation for “${consortium.label}”`,
            });
          }

          app.notifications.push({
            autoDismiss: 1,
            level: 'info',
            message: `Starting computation for “${consortium.label}”`,
          });

          app.core.pool.events.on('run:end', runEnd);
          app.core.pool.events.on('error', runError);
          app.core.pool.events.once('computation:complete', () => {
            app.notifications.push({
              action: {
                label: 'View Results',
                callback: () => hashHistory.push(`/consortia/${consortiumId}`),
              },
              autoDismiss: 3,
              level: 'success',
              message: `Computation for “${consortium.label}” complete`,
            });
            app.core.pool.events.removeListener('run:end', runEnd);
            app.core.pool.events.removeListener('error', runError);
          });

          return app.core.computations.kickoff({ consortiumId, projectId });
        });
    };
  }
);
