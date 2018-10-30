'use strict';

/**
 * @module computation-service
 */
const {
  models: {
    computation: {
      Computation,
      RemoteComputationResult,
    },
  },
  utils: { getSyncedDatabase },
} = require('coinstac-common');
const crypto = require('crypto');
const deepEqual = require('deep-equal');

const ModelService = require('../model-service');

/**
 * @extends ModelService
 */
class ComputationService extends ModelService {
  modelServiceHooks() { // eslint-disable-line class-methods-use-this
    return {
      dbName: 'computations',
      ModelType: Computation,
    };
  }

  /**
   * Can a computation start?
   *
   * @params {string} consortiumId
   * @returns {Promise} Resolves if a computation *can* start or rejects with an
   * error if a computation *can not* start.
   */
  canStartComputation(consortiumId) {
    const { client } = this;

    return getSyncedDatabase(
      client.dbRegistry,
      `remote-consortium-${consortiumId}`
    )
      .then(remoteDatabase => Promise.all([
        client.consortia.get(consortiumId),
        remoteDatabase.find({
          selector: {
            complete: false,
          },
        }),
      ]))
      .then(([consortium, docs]) => {
        const { activeComputationId } = consortium;
        const isConsortiumOwner = consortium.owners.indexOf(client.auth.getUser().username) > -1;

        if (!activeComputationId) {
          throw new Error(
            `Consortium "${consortium.label}" doesn't have an active computation`
          );
        }

        if (!isConsortiumOwner) {
          throw new Error('Only consortium owners can start a computation');
        }

        /**
         * This enforces one run per consortium.
         *
         * @todo Either move this functionality into coinstac-common or refactor
         * UI so consortia may run multiple computations.
         */
        if (docs.length) {
          throw new Error('Only one computation may run at a time');
        }
      });
  }

  checkProjectCompInputs({ consortiumId, projectId }) {
    const { consortia, projects } = this.client;

    return Promise.all([
      consortia.get(consortiumId),
      projects.setMetaContents(projectId),
    ])
      .then(([consortium, project]) => {
        /**
         * Ensure project's computation inputs match the consortium; if not,
         * throw an error and make the user re-match.
         *
         * @todo Find better method for guaranteeing project-to-computation
         * input alignment.
         *
         * {@link https://github.com/MRN-Code/coinstac/issues/151}
         */
        if (
          !deepEqual(
            consortium.activeComputationInputs,
            project.computationInputs
          )
        ) {
          throw new Error(
            `Project ${project.name}'s inputs must be re-entered`
          );
        }

        return [consortium, project];
      });
  }

  /**
   * Call the local pipeline runner pool's `triggerRunner`.
   * @private
   *
   * @param {Object} options
   * @param {string} options.consortiumId Consortium the runId is from
   * @param {string} options.projectId Project to run on
   * @param {string} options.runId
   * @returns {Promise}
   */
  doTriggerRunner({ consortiumId, projectId, runId }) {
    const { pool } = this.client;
    if (!consortiumId) {
      return Promise.reject(new Error('Consortium ID required'));
    } if (!projectId) {
      return Promise.reject(new Error('Project ID required'));
    } if (!runId) {
      return Promise.reject(new Error('Computation run ID required'));
    }

    return this.checkProjectCompInputs({ consortiumId, projectId })
      .then(([consortium, project]) => {
        const options = {
          _id: runId,
          computationId: consortium.activeComputationId,
          computationInputs: consortium.activeComputationInputs,
          consortiumId,
        };

        if (
          consortium.activeComputationInputs
        && Array.isArray(consortium.activeComputationInputs)
        ) {
          options.pluginState = {
            inputs: consortium.activeComputationInputs,
          };
        }

        const result = new RemoteComputationResult(options);

        return pool.triggerRunner(result, project);
      });
  }

  /**
   * Kick off a remote computation result.
   *
   * @param {Object} options
   * @param {string} options.consortiumId
   * @param {string} options.projectId
   * @returns {Promise}
   */
  kickoff({ consortiumId, projectId }) {
    return this.canStartComputation(consortiumId)
      .then(() => this.client.consortia.get(consortiumId))
      .then(({ activeComputationId }) => {
        const runId = crypto.createHash('md5')
          .update(`${consortiumId}${activeComputationId}${Date.now()}`)
          .digest('hex');

        return this.doTriggerRunner({ consortiumId, projectId, runId });
      });
  }

  /**
   * Join an already in progress computation.
   *
   * @param {Object} options
   * @param {string} options.consortiumId Consortium the runId is from
   * @param {string} options.projectId Project to run on
   * @param {string} options.runId
   * @return {Promise}
   */
  joinRun({ consortiumId, projectId, runId }) {
    return this.doTriggerRunner({ consortiumId, projectId, runId });
  }

  /**
   * Allows the client to join a run for which they have no started document for.
   * @param  {string} options.consortiumId Consortium the runId is from
   * @param  {string} options.projectId    project to run on
   * @param  {string} options.runId
   * @return {Promise}
   */
  joinSlavedRun({ consortiumId, projectId, runId }) {
    const { pool } = this.client;
    this.checkProjectCompInputs({ consortiumId, projectId })
      .then(([consortium, project]) => {
        return Promise.all([
          consortium,
          project,
          this.client.dbRegistry.get(`remote-consortium-${consortiumId}`).get(runId),
        ]);
      })
      .then(([consortium, project, resultDoc]) => {
        const options = {};
        if (
          consortium.activeComputationInputs
        && Array.isArray(consortium.activeComputationInputs)
        && !resultDoc.pluginState.inputs
        ) {
          options.pluginState = {
            inputs: consortium.activeComputationInputs,
          };
        }

        const result = new RemoteComputationResult(Object.assign({}, resultDoc, options));

        return pool.triggerRunner(result, project);
      });
  }

  /**
   * Determine whether the user should join a computation's run.
   *
   * @param {string}  consortiumId
   * @param {boolean} notFirstRun
   * @returns {Promise} Resolves to a boolean
   */
  shouldJoinRun(consortiumId, notFirstRun) {
    const { auth, consortia, dbRegistry } = this.client;

    return Promise.all([
      /**
       * @todo coinstac-storage-proxy doesn't allow GET requests to
       * `local-consortium-*` databases. Figure out another approach.
       */
      dbRegistry.get(`local-consortium-${consortiumId}`).all(),
      consortia.getActiveRunId(consortiumId),
    ])
      .then(([localDocs, runId]) => {
        if (!runId) {
          return false;
        }

        const { username } = auth.getUser();

        // Determine whether the user has a doc with the run ID:
        if (notFirstRun) {
          return !localDocs.find(({ _id }) => {
            return _id.indexOf(runId) > -1 && _id.indexOf(username) > -1;
          });
        }

        // first time this run has been joined since init
        // allow resume/first join
        return true;
      });
  }
}

module.exports = ComputationService;
