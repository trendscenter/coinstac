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
    this.pool.events.on('computation:complete', runId => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [computation:complete]', 'Run id: %s', runId
      );
    });
    this.pool.events.on('ready', () => {
      logger.verbose('RemotePipelineRunnerPool.events [ready]');
    });
    this.pool.events.on('listener:created', dbName => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [listener:created]', 'DB name: %s', dbName
      );
    });
    this.pool.events.on('queue:start', runId => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [queue:start]', 'Run id: %s', runId
      );
    });
    this.pool.events.on('queue:end', runId => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [queue:end]', 'Run id: %s', runId
      );
    });
    this.pool.events.on('pipeline:inProgress', () => {
      logger.verbose('RemotePipelineRunnerPool.events [pipeline:inProgress]');
    });
    this.pool.events.on('run:end', compResult => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [run:end]', 'Computation result:', compResult
      );
    });
    this.pool.events.on('computation:complete', runId => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [computation:complete]', 'Run id: %s', runId
      );
    });
    this.pool.events.on('computation:markedComplete', runId => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [computation:markedComplete]', 'Run id: %s', runId
      );
    });
    this.pool.events.on('error', error => {
      logger.verbose('RemotePipelineRunnerPool.events [error]', error);
    });
    this.pool.events.on('run:start', result => {
      logger.verbose(
        'RemotePipelineRunnerPool.events [run:start]', 'Result:', result
      );
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
