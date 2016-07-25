'use strict';

/**
 * @module computation-service
 */
const common = require('coinstac-common');
const Computation = common.models.computation.Computation;
const crypto = require('crypto');
const getSyncedDatabase = require('../utils/get-synced-database');
const merge = require('lodash/merge');
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
    if (!consortiumId) {
      return Promise.reject(new Error('Consortium ID required'));
    } else if (!projectId) {
      return Promise.reject(new Error('Project ID required'));
    } else if (!runId) {
      return Promise.reject(new Error('Computation run ID required'));
    }

    const { consortia, pool, projects } = this.client;

    return projects.get(projectId)
      .then(project => Promise.all([
        project,
        projects.getMetaFileContents(project.metaFile),
      ]))
      .then(([project, projectMeta]) => Promise.all([
        consortia.get(consortiumId),

        // Map the project's metadata to its files
        // TODO: Refactor this into model method?
        Object.assign({}, project, {
          files: project.files.map(file => {
            const meta = projectMeta.find(m => {
              return file.filename.indexOf(m[0]) > -1;
            });

            if (!meta) {
              throw new Error(`Couldn't find meta for ${file.filename}`);
            }

            return merge({}, file, {
              tags: {
                isControl: meta[1],
              },
            });
          }),
        }),
      ]))
      .then(([consortium, project]) => {
        const result = new RemoteComputationResult({
          _id: runId,
          computationId: consortium.activeComputationId,
          consortiumId,
        });

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
  joinComputation({ consortiumId, projectId, runId }) {
    return this.doTriggerRunner({ consortiumId, projectId, runId });
  }
}

module.exports = ComputationService;
