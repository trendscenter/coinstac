'use strict';

/**
 * @module service/remote-pipeline-runner-pool
 */

const coinstacCommon = require('coinstac-common');
const computationRegistryService = require('./computation-registry');
const dbRegistryService = require('./db-registry');
const logger = require('./logger');
const RemotePipelineRunnerPool =
  coinstacCommon.models.pipeline.runner.pool.RemotePipelineRunnerPool;

/**
 * @property pool RemotePipelineRunnerPool
 * {@link http://mrn-code.github.io/coinstac-common/PipelineRunnerPool.html RemotePipelineRunnerPool}
 */
module.exports = {

  pool: null,

  /**
   * initializes the server pipeline runner pool.
   * @returns {Promise}
   */
  init() {
    const dbRegistry = dbRegistryService.get();
    const computationRegistry = computationRegistryService.get();

    this.pool = new RemotePipelineRunnerPool({ computationRegistry, dbRegistry });

    // Wire up event listeneres
    this.pool.events.on('run:start', computationResult => {
      /* istanbul ignore next */
      logger.info(
        'PipelineRunner starting run',
        computationResult.serialize()
      );
    });
    this.pool.events.on('run:end', computationResult => {
      /* istanbul ignore next */
      logger.info(
        'PipelineRunner ending run',
        computationResult.serialize()
      );
    });
    this.pool.events.on('queue:start', runId => {
      /* istanbul ignore next */
      logger.info('Starting queue', runId);
    });
    this.pool.events.on('queue:end', runId => {
      /* istanbul ignore next */
      logger.info('Ending queue', runId);
    });
    this.pool.events.on('pipeline:inProgress', runId => {
      /* istanbul ignore next */
      logger.info('Pipeline progressing', runId);
    });

    logger.info('initializing RemotePipelineRunnerPool…');

    return this.pool.init().then(
      () => {
        logger.info('RemotePipelineRunnerPool ready');
      },

      // TODO: Move error logging to handler?
      error => {
        logger.error(
          'RemotePipelineRunnerPool initialization failed',
          error
        );
        throw error;
      }
    );
  },

  /**
   * tears down the remote pipeline runner pool instance
   * @returns {Promise}
   */
  teardown() {
    logger.info('destroying RmotePipelineRunnerPool...');

    return this.pool.destroy();
  },
};
