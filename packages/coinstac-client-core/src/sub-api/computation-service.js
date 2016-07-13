'use strict';

/**
 * @module computation-service
 */
const common = require('coinstac-common');
const Computation = common.models.computation.Computation;
const crypto = require('crypto');
const getSyncedDatabase = require('../utils/get-synced-database');
const ModelService = require('../model-service');
const RemoteComputationResult = common.models.computation.RemoteComputationResult;

/**
 * @extends ModelService
 */
class ComputationService extends ModelService {
  modelServiceHooks() {
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
    const client = this.client;

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
        const activeComputationId = consortium.activeComputationId;
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

  /**
   * Kick off a remote computation result.
   *
   * @param {Object} options
   * @param {string} options.consortiumId
   * @param {string} options.projectId
   * @returns {Promise}
   */
  kickoff({ consortiumId, projectId }) {
    const client = this.client;

    return this.canStartComputation(consortiumId)
      .then(() => Promise.all([
        client.consortia.get(consortiumId),
        client.projects.get(projectId),
      ]))
      .then(([consortium, project]) => {
        const activeComputationId = consortium.activeComputationId;
        const runId = crypto.createHash('md5')
          .update(`${consortiumId}${activeComputationId}${Date.now()}`)
          .digest('hex');

        const result = new RemoteComputationResult({
          _id: runId,
          computationId: activeComputationId,
          consortiumId,
        });

        return client.pool.triggerRunner(result, project);
      });
  }

  /**
   * Join an already in progress computation
   * @param  string { consortiumId  the consortium the runId is from
   * @param  string projectId       the project to run on
   * @param  string runId     }     the run id to join
   * @return Promise           promise from runner pool
   */
  joinComputation({ consortiumId, projectId, runId }) {
    const client = this.client;
    const consortium = client.consortia.get(consortiumId);
    const project = client.projects.get(projectId);
    const activeComputationId = consortium.activeComputationId;


    const result = new RemoteComputationResult({
      _id: runId,
      computationId: activeComputationId,
      consortiumId,
    });

    return client.pool.triggerRunner(result, project);
  }
}

module.exports = ComputationService;
