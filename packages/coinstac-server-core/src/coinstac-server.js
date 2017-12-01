'use strict';

const coinstacCommon = require('coinstac-common');
const ComputationRegistry = require('coinstac-computation-registry');
const logger = require('./services/logger.js');
const os = require('os');
const path = require('path');
const touch = require('touch');
const winston = require('winston');

const BASE_PATH = path.join(os.tmpdir(), 'coinstac-server-core');

/**
 * COINSTAC Server.
 * @module
 * @class
 *
 * @property {Object} config Passed configuration
 * @property {(ComputationRegistry|null)} computationRegistry
 * @property {(DBRegistry|null)} dbRegistry
 * @property {winston.Logger} logger
 * @property {(RemotePipelineRunnerPool|null)} remotePipelineRunnerPool
 */
class CoinstacServer {
  /**
   * @param {Object} config
   * @param {(string|Object[])} [config.seed] Whether or not to seed the database.
   * This only seeds if no documents exist in the `consortia` database. Pass
   * JSON as a string or a collection of document objects.
   * @param {string} [config.dbUrl] Database URL.
   * @param {boolean} [config.inMemory=false] Use an in-memory database using
   * instead of writing to disk.
   * @param {string} [config.logFile] Full path to a log file. No log files
   * will be written if this isn not set.
   * @param {string} [config.logLevel=info] Logger level for winston's console
   * transport.
   */
  constructor(config) {
    if (typeof config !== 'object') {
      throw new Error('Expected configuration object');
    }

    this.config = config;

    this.computationRegistry = new ComputationRegistry();
    this.dbRegistry = null;
    this.remotePipelineRunnerPool = null;

    this.logger = logger;
    this.logger.level = this.config.logLevel || 'info';

    if (this.config.logFile) {
      // Ensure process can write to log file
      touch.sync(this.config.logFile);

      this.logger.add(winston.transports.File, {
        filename: this.config.logFile,
      });
    }
  }

  /**
   * Get configured remote pipeline runner pool.
   * @private
   *
   * @returns {Promise<RemotePipelineRunnerPool>}
   */
  getRemotePipelineRunnerPool() {
    if (!this.computationRegistry) {
      return Promise.reject(new Error('Expected ComputationRegistry'));
    } else if (!this.dbRegistry) {
      return Promise.reject(new Error('Expected DBRegistry'));
    }

    const RemotePipelineRunnerPool =
      coinstacCommon.models.pipeline.runner.pool.RemotePipelineRunnerPool;

    const pool = new RemotePipelineRunnerPool({
      computationRegistry: this.computationRegistry,
      dbRegistry: this.dbRegistry,
    });

    pool.events.on('computation:complete', runId => this.logger.verbose(
      'RemotePipelineRunnerPool.events [computation:complete]',
      `Run id: ${runId}`
    ));
    pool.events.on('ready', () => this.logger.verbose(
      'RemotePipelineRunnerPool.events [ready]'
    ));
    pool.events.on('listener:created', dbName => this.logger.verbose(
      'RemotePipelineRunnerPool.events [listener:created]', `DB name: ${dbName}`
    ));
    pool.events.on('queue:start', runId => this.logger.verbose(
      'RemotePipelineRunnerPool.events [queue:start]', `Run id: ${runId}`
    ));
    pool.events.on('queue:end', runId => this.logger.verbose(
      'RemotePipelineRunnerPool.events [queue:end]', `Run id: ${runId}`
    ));
    pool.events.on('pipeline:inProgress', () => this.logger.verbose(
      'RemotePipelineRunnerPool.events [pipeline:inProgress]'
    ));
    pool.events.on('run:end', compResult => this.logger.verbose(
      'RemotePipelineRunnerPool.events [run:end]',
      'Computation result:',
      compResult
    ));
    pool.events.on('computation:complete', runId => this.logger.verbose(
      'RemotePipelineRunnerPool.events [computation:complete]',
      `Run id: ${runId}`
    ));
    pool.events.on('computation:markedComplete', runId => this.logger.verbose(
      'RemotePipelineRunnerPool.events [computation:markedComplete]',
      `Run id: ${runId}`
    ));
    pool.events.on('error', error => this.logger.error(
      'RemotePipelineRunnerPool.events [error]', error
    ));
    pool.events.on('run:start', result => this.logger.verbose(
      'RemotePipelineRunnerPool.events [run:start]', 'Result:', result
    ));

    this.logger.info('initializing RemotePipelineRunnerPool...');

    return pool.init().then(
      () => {
        this.logger.info('RemotePipelineRunnerPool ready');
        return pool;
      },

      // TODO: Move error logging to handler?
      (error) => {
        this.logger.error(
          'RemotePipelineRunnerPool initialization failed',
          error
        );
        throw error;
      }
    );
  }

  /**
   * Maybe seed the consortia database.
   * @private
   *
   * @returns {Promise<boolean>}
   */
  maybeSeedConsortia() {
    const Consortium = coinstacCommon.models.Consortium;
    const seed = this.config.seed;
    let seedDocs;

    if (!this.dbRegistry) {
      return Promise.reject(new Error('Seeding consortia requires DBRegistry'));
    }

    if (seed && typeof seed === 'string') {
      try {
        seedDocs = JSON.parse(seed);
      } catch (error) {
        return Promise.reject(error);
      }
    } else {
      seedDocs = seed;
    }

    if (!seedDocs || !Array.isArray(seedDocs) || !seedDocs.length) {
      return Promise.resolve(false);
    }

    this.logger.info('Seeding consortia database...');

    this.dbRegistry.get('consortia')
      .bulkDocs(seedDocs.map(seedDoc => new Consortium(seedDoc).serialize()))
      .then(() => {
        this.logger.info('Seeded consortia database');
        return true;
      });
  }

  /**
   * Start server.
   *
   * @returns {Promise}
   */
  start() {
    this.logger.info('Starting server...');

    return this.computationRegistry.serverStart()
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Stop server.
   *
   * @returns {Promise}
   */
  stop() {
    const responses = [];

    this.logger.info('Stopping server...');

    if (this.computationRegistry) {
      this.computationRegistry = null;
    }

    return Promise.all(responses);
  }
}

/**
 * Database path.
 *
 * @const {string}
 */
CoinstacServer.DB_PATH = path.join(BASE_PATH, 'dbs');

/**
 * Computations path.
 *
 * @const {string}
 */
CoinstacServer.COMPUTATIONS_PATH = path.join(BASE_PATH, 'computations');

module.exports = CoinstacServer;
