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
   * Kick off a remote computation result.
   *
   * @param {Object} options
   * @param {string} options.consortiumId
   * @param {string} options.projectId
   * @returns {Promise}
   */
  kickoff({ consortiumId, projectId }) {
    const client = this.client;

    return getSyncedDatabase(
      client.dbRegistry,
      `remote-consortium-${consortiumId}`
    )
    .then(remoteDatabase => {
      return Promise.all([
        client.consortia.get(consortiumId),
        client.projects.get(projectId),
        remoteDatabase.find({
          selector: {
            complete: false,
          },
        }),
      ]);
    })
    .then(([consortium, project, docs]) => {
      const activeComputationId = consortium.activeComputationId;
      const isConsortiumOwner = consortium.owners.indexOf(client.auth.getUser().username) > -1;

      if (!activeComputationId) {
        throw new Error(
          `Consortium "${consortium.label}" doesn't have an active computation`
        );
      }

      if (!isConsortiumOwner && !docs.length) {
        throw new Error('Only consortium owners can start!');
      }

      const runId = docs.length ?
        docs[0]._id :
        crypto.createHash('md5')
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
}

module.exports = ComputationService;
