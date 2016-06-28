'use strict';

// app package deps
const mkdirp = require('mkdirp');
const bluebird = require('bluebird');
bluebird.config({ warnings: false });
const path = require('path');
const winston = require('winston');
const Logger = winston.Logger;
const Console = winston.transports.Console;
const hawkifyPouchDB = require('hawkify-pouchdb');

// app utils
const common = require('coinstac-common');
const LocalPipelineRunnerPool = common.models.pipeline.runner.pool.LocalPipelineRunnerPool;
const appDirectory = require('./utils/app-directory');
const computationRegistryFactory = common.services.computationRegistry;
const registryFactory = require('coinstac-common').services.dbRegistry;

// init & teardown
const initializeAPIClient = require('./init/halfpenny');
const teardownAuth = require('./teardown/auth');

// client sub-apis
// const project = require('./sub-api/project');
const Auth = require('./sub-api/auth');
const ConsortiaService = require('./sub-api/consortia-service');
const ComputationService = require('./sub-api/computation-service');
const ProjectServices = require('./sub-api/project-service');


/**
 * Create a user client for COINSTAC
 * @example <caption>construction and initialization</caption>
 * const client = new CoinstacClient();
 * client.initialize((err) => {
 *   if (err) { throw err; }
 *   client.logger.info('Success! I’ve initialized!');
 * });
 *
 * @class
 * @constructor
 * @param {object} opts
 * @property {string} [opts.appDirectory] Path to on-disk storage. Primarily
 * used for testing.
 * @param {Winston} [opts.logger] permit user injected logger vs default logger
 * @param {string} [opts.logLevel] npm log levels, e.g. 'verbose', 'error', etc
 * @param {object} [opts.db] coinstac-common dbRegistry service configuration
 * @param {string} [opts.hp] URL configutation for Halfpenny's `baseUrl`
 * @param {LocalStorage} [opts.storage] storage engine for halfpenny
 * @property {LocalStorage} storage
 * @property {Halfpenny} apiClient
 * @property {DBRegistry} dbRegistry
 * @property {object} dbConfig db registry configuration stashed for late initialization
 * @property {Winston} logger
 * @property {string} appDirectory
 * @property {Auth} auth
 * @property {Project} project
 */
class CoinstacClient {
  constructor(opts) {
    if (!opts || !(opts instanceof Object)) {
      throw new TypeError('coinstac-client requires configuration opts');
    }
    this.dbConfig = opts.db;
    this.storage = opts.storage;
    this.appDirectory = opts.appDirectory || appDirectory;
    this.halfpennyBaseUrl = opts.hp;
    this.halfpennyDirectory = path.join(this.appDirectory, '.halfpenny');
    this.logger = opts.logger || new Logger({ transports: [new Console()] });

    // hack for electron-remote. generate full API, even if it's dead.
    this.auth = {};
    this.consortia = {};
    this.computations = {};
    this.dbRegistry = {};
    this.halfpenny = {};
    this.projects = {};
    this.pool = {};

    /* istanbul ignore if */
    if (opts.logLevel) {
      this.logger.level = opts.logLevel;
    }
  }

  /**
   * Initialize.
   *
   * Start up coinstac-client-core. Initialization consists of:
   *
   *   * instantiating an API client instance
   *   * applying security headers to our PouchDB stores
   *
   * @param {Object} credentials
   * @param {string} credentials.password
   * @param {string} credentials.username
   * @param {string} [credentials.email]
   * @param {string} [credentials.name]
   * @param {Promise}
   */
  initialize(credentials) {
    if (!(this instanceof CoinstacClient)) {
      return Promise.reject(
        new TypeError('expected `this` to be CoinstacClient instance')
      );
    } else if (
      typeof credentials === 'undefined' || !(credentials instanceof Object)
    ) {
      return Promise.reject(
        new TypeError('Expected credentials object')
      );
    } else if (!credentials.password || !credentials.username) {
      return Promise.reject(
          new TypeError('Expected credentials to contain a username and password')
      );
    }
    this.logger.info('initializing coinstac-client');

    return Promise.resolve(bluebird.promisify(mkdirp)(this.halfpennyDirectory))
      .then(() => {
        const hpOpts = {
          baseUrl: this.halfpennyBaseUrl,
          storagePath: this.halfpennyDirectory,
        };

        /* istanbul ignore else */
        if (this.storage) {
          hpOpts.storage = this.storage;
        }

        this.halfpenny = initializeAPIClient(hpOpts);
        this.auth = new Auth({
          halfpenny: this.halfpenny,
        });

        return this._initAuthorization(credentials);
      })
      .then(() => this._initDBRegistry())
      .then(() => this._initSubAPIs())
      .then(() => this._initComputationRegistry())
      .then(() => this._initPool())
      .then(() => this.auth.getUser().serialize());
  }

  /**
   * Examine the shape of `credentials` to determine whether to log in
   * or create a new user.
   * @param {object} credentials @see `initialize`
   * @returns {Promise}
   */
  _initAuthorization(credentials) {
    if (credentials.email && credentials.name) {
      return this.auth.createUser(credentials);
    }
    return this.auth.login(credentials);
  }

  /**
   * initialize the user's ComputationRegistry
   * @private
   * @returns {Promise}
   */
  _initComputationRegistry() {
    const computationsDirectory = path.join(this.appDirectory, 'computations');

    this.logger.info('initializing ComputationRegistry');

    return bluebird.promisify(mkdirp)(computationsDirectory)
      .then(() => computationRegistryFactory({
        isLocal: true,
        dbRegistry: this.dbRegistry,
        path: computationsDirectory,
      }))
      .then((reg) => { this.computationRegistry = reg; });
  }


  _initDBRegistry() {
    const defaults = {
      isLocal: true,
      path: appDirectory,
      remote: {
        db: {
          protocol: 'https',
          hostname: 'prodapicoin.mrn.org',
          port: 5984,
          pathname: 'coinstacdb',
        },
      },
    };
    /* istanbul ignore next */
    const pouchAjax = function stubPouchDBAjax() {};
    // @TODO ^ replace with require('pouch-ajax') when pouchdb#5322 is closed
    // and hawkify-pouchdb actually wraps the pouchAjax function successfully!
    // for now, hawkify-pouchdb simply returns an object with the proper headers.
    // all dbs will have the returned ajax headers applied.
    const ajax = {
      ajax: function applyHawkAjaxHeaders() {
        return hawkifyPouchDB(pouchAjax, this.halfpenny.auth.getAuthCredentials());
      }.bind(this),
    };
    const regOpts = Object.assign(defaults, this.dbConfig, ajax);
    this.dbRegistry = registryFactory(regOpts);
    return this.dbRegistry;
  }

  /**
   * initialize the user's LocalPipelineRunnerPool
   * @private
   * @returns {Promise}
   */
  _initPool() {
    this.logger.info('construct LocalPipelineRunnerPool');
    const user = this.auth.getUser();
    return this.consortia.getUserConsortia(user.username)
    .then((tia) => {
      const tiaIds = tia.map((tium) => tium._id);
      this.logger.info(`user belongs to consortia: ${tiaIds.join(', ')}`);
      this.pool = new LocalPipelineRunnerPool({
        listenTo: tiaIds,
        computationRegistry: this.computationRegistry,
        dbRegistry: this.dbRegistry,
        user,
      });

      this.pool.events.on('computation:complete', runId => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.events [computation:complete]', 'Run id: %s', runId
        );
      });
      this.pool.events.on('ready', () => {
        this.logger.verbose('LocalPipelineRunnerPool.events [ready]');
      });
      this.pool.events.on('listener:created', dbName => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.events [listener:created]', 'DB name: %s', dbName
        );
      });
      this.pool.events.on('queue:start', runId => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.events [queue:start]', 'Run id: %s', runId
        );
      });
      this.pool.events.on('queue:end', runId => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.events [queue:end]', 'Run id: %s', runId
        );
      });
      this.pool.events.on('pipeline:inProgress', () => {
        this.logger.verbose('LocalPipelineRunnerPool.events [pipeline:inProgress]');
      });
      this.pool.events.on('run:end', compResult => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.events [run:end]', 'Computation result:', compResult
        );
      });
      this.pool.events.on('computation:complete', runId => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.events [computation:complete]', 'Run id: %s', runId
        );
      });
      this.pool.events.on('run:start', result => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.events [run:start]', 'Result:', result
        );
      });

      this.logger.info('initializing LocalPipelineRunnerPool');
    })
    .then(() => this.pool.init())
    .then(() => {
      this.pool.consortiaListener.on('delete', event => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.consortiaListener [delete]',
          'Name: %s', event.name,
          'Document:', event.doc
        );
      });
      this.pool.consortiaListener.on('change', event => {
        this.logger.verbose(
          'LocalPipelineRunnerPool.consortiaListener [change]',
          'Name: %s', event.name,
          'Document:', event.doc
        );
      });
    });
  }

  /**
   * Append sub-apis to client instance.
   * @returns {undefined}
   */
  _initSubAPIs() {
    const subAPIConf = {
      client: this,
      dbRegistry: this.dbRegistry,
    };

    // init sub-api services
    this.consortia = new ConsortiaService(subAPIConf);
    this.computations = new ComputationService(subAPIConf);
    this.projects = new ProjectServices(subAPIConf);
  }

  /**
   * Inverse of .initialize.  Clears all authorization content, clears the
   * db registry (content remains intact), and purges the API client instance
   * @returns {undefined}
   */
  teardown() {
    // Repeated so Sinon can spy:
    return teardownAuth.teardownAuth(this)
    .then(() => (this.pool ? this.pool.destroy() : this.dbRegistry.destroy()))
    .then(() => {
      delete this.halfpenny;
      delete this.auth;
      delete this.consortia;
      delete this.computations;
      delete this.projects;
      return null;
    });
  }
}

module.exports = CoinstacClient;
