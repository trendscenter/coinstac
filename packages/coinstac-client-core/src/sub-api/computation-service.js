'use strict';

/**
 * @module computation-service
 */
const common = require('coinstac-common');
const Computation = common.models.computation.Computation;
const crypto = require('crypto');
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
   * Kick off a remote computation result.
   *
   * @param {Object} options
   * @param {string} options.consortiumId
   * @param {string} options.projectId
   * @returns {Promise}
   */
  kickoff({ consortiumId, projectId }) {
    const client = this.client;

    // Create an unique run ID based on the parameters and date
    const runId = crypto
      .createHmac('sha256', `${consortiumId} ${projectId} ${Date.now()}`)
      .digest('hex');

    return Promise.all([
      client.consortia.db.get(consortiumId),
      client.projects.db.get(projectId),
    ]).then(([consortium, project]) => {
      const result = new RemoteComputationResult({
        _id: runId,
        computationId: consortium.activeComputationId,
        consortiumId,
      });

      return client.pool.triggerRunner(result, project);
    });
  }
}

module.exports = ComputationService;
