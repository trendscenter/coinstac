'use strict';

const EventEmitter = require('events').EventEmitter;
const Base = require('../../../base');
const DBRegistry = require('../../../../services/classes/db-registry');
const DBListener = require('../../../db-listener');
const Consortium = require('../../../consortium');
const ComputationResult = require('../../../computation/computation-result');
const RemoteComputationResult = require('../../../computation/remote-computation-result');
const LocalComputationResult = require('../../../computation/local-computation-result');
const Pouchy = require('pouchy');
const joi = require('joi');
const values = require('lodash/values');
const find = require('lodash/find');
const without = require('lodash/without');
const get = require('lodash/get');
const bluebird = require('bluebird');
const PLUGINS = require('../../plugins');

/**
 * PipelineRunnerPool fully initialized with sync'd critical DBs
 * and listeners ready-to-go!
 *
 * @event PipelineRunnerPool#ready
 * @param {undefined}
 */

/**
 * PipelineRunnerPool has detected that DecentralizedComputation run is fully
 * complete
 *
 * @event PipelineRunnerPool#computation:complete
 * @param {string} runId
 * @param {string} consortiumId
 */

/**
 * PipelineRunner will resume processing on its pipeline
 *
 * @event PipelineRunnerPool#run:start
 * @param {ComputationResult}
 */

/**
 * PipelineRunner's pipeline has halted
 * on its pipeline.
 * @NOTE use `run:end` to detect when a pipleine-run
 * has finished vs halt.  halt is used internally and may not
 * be bubbled out on run:end!
 *
 * @event PipelineRunnerPool#run:end
 * @param {ComputationResult}
 */

/**
 * queue has instantiated on a runId.
 *
 * @event PipelineRunnerPool#queue:start
 * @param {string} runId
 */

/**
 * queue has completed on a runId, and been deferenced.
 *
 * @event PipelineRunnerPool#queue:end
 * @param {string} runId
 */

/**
 * a run has completed, and another one will begin. the queue
 * will not proceed until a run completes where the pipeline
 * is no longer in progress
 *
 * @event PipelineRunnerPool#pipeline:inProgress
 * @param {string} runId
 */

/**
 * a new listener has been created for the specified db name
 *
 * @event PipelineRunnerPool#listener:created
 * @param {string} dbName
 */

/**
 * @abstract
 * @class PipelineRunnerPool
 * @extends Base
 * @constructor
 * @description listens for changes in computation result data stores, and then
 * triggers PipelineRunners to resume execution using changed/new db data.
 * value proposition that this Pool offers to the COINSTAC ecosystem is:
 * - minimization of db change emitters (e.g. one emitter per member store)
 * - single source of instantiation and management for PipelineRunner instances
 * - single source of computation preparation, pre-PipelineRunner execution
 *
 * call `.init` to kickoff the Pool activity when ready
 *
 * @property {Pouchy} consortiaDB
 * @property {Pouchy} computationsDB
 * @property {boolean} isActive runner pool is actively working and able to handle new requests
 * @property {boolean} isDestroyed
 * @property {boolean} isDestroying
 * @property {boolean} isInitialized
 * @property {boolean} isInitializing
 * @property {object} resultsListeners DBListener instances, indexed by db name
 * @property {object} consortiaListener DBListener instance, used to trigger
 *                                      listening on a new results stores
 *                                      when a new consortium enters the scene
 * @property {object} runners PipelineRunner instances, indexed by runId
 * @property {object} runQueue promise `queue` of jobs waiting to enter
 *                             PipelineRunners, indexed by runId
 * @property {object} runQueueSize num jobs in queue, indexed by runId
 * @property {function} on/emit/off basic EventEmitter functions
 */
class PipelineRunnerPool extends Base {

  /**
   * Build a runner pool.
   * @param {object} [opts]
   * @param {string[]} [opts.listenTo] set of consortium ids to listen to
   *                                        on init. default listens to all.
   */
  constructor(opts) {
    super(opts);
    this.runQueue = {};
    this.runQueueSize = {};
    this.runners = {};
    this.resultsListeners = {}; // indexed by `name` => e.g. remote-consortium-{ _.id }
    this.events = new EventEmitter();
    this.events.setMaxListeners(20);
    this.isInitializing = null;
    this.isInitialized = null;
    this._instance = ++PipelineRunnerPool.instanceCount;
    this.listenTo = opts.listenTo;
  }

  get isActive() {
    return (
      !(this.isDestroying || this.isDestroyed) &&
      (this.isInitialized || this.isInitializing)
    );
  }

  /**
   * @abstract
   * @protected
   * @description generates env specific PipelineRunner.  called when no
   * PipelineRunner exists
   * @param {ComputationResult} result
   * @returns {Promise}
   */
  createNewRunner() {
    return Promise.reject(
      new ReferenceError('abstract createNewRunner must be extended')
    );
  }

  /**
   * @description destroy pool.  scraps dbs in the registry (not the remote copies),
   * and all DBListeners
   * @returns {Promise}
   */
  destroy() {
    /* istanbul ignore if */
    if (!this.isInitialized && !this.isInitializing) {
      return Promise.reject(new Error(
        'must initialize pool before destroying it.'
      ));
    }

    this.isDestroying = true;

    return (
      !this.isInitialized ?
        // wait for init completion before destroying
        // listen for the pool to come up, and only permit destroy sequence
        // once init complete
        new Promise((resolve, reject) => {
          this.events.on('ready', resolve);
          /* istanbul ignore next */
          this.events.on('error', reject);
        }) :
        Promise.resolve()
    )
    .then(() => { // purge all listeners
      this.events.removeAllListeners();
      Pouchy.PouchDB.removeAllListeners();

      /* istanbul ignore else */
      if (this.consortiaListener) {
        return this.consortiaListener.destroy();
      }
    })
    .then(() => Promise.all(values(this.resultsListeners).map(listener => {
      return listener.destroy();
    })))
    .then(() => {
      delete this.resultsListeners;
    })
    .then(() => this.dbRegistry.destroy())
    .then(() => {
      this.isInitialized = false;
      this.isInitializing = false;
      this.isDestroying = false;
      this.isDestroyed = true;
    });
  }

  /**
   * @description gets a DecentralizedComputation instance from the registry
   * @param {string} id computations store id
   * @returns {Promise} Resolves with a `DecentralizedComputation`
   */
  getDecentralizedComputation(id) {
    return this.dbRegistry.get('computations').get(id)
      .then(({ name, version }) => this.computationRegistry.add(name, version));
  }

  /**
   * generates a set of plugins.
   * @param {object} opts
   * @param {DecentralizedComputation} opts.comp
   * @param {string} opts.env local/remote
   * @returns {Object} Plugin hooks
   * @property {Function[]} preRun
   * @property {Function[]} postRun
   */
  getPipelinePlugins(opts) {
    const plugins = opts.comp.plugins;
    const env = opts.env;
    /* istanbul ignore if */
    if (!env || !(env === 'local' || env === 'remote')) {
      throw new ReferenceError('expected local or remote env');
    }
    const hooks = { preRun: [], postRun: [] };
    if (!plugins) { return hooks; }
    plugins.forEach((plugin) => {
      let pre;
      let post;
      /* istanbul ignore else */
      if (typeof plugin === 'string') {
        pre = get(PLUGINS, `[${plugin}]['preRun'][${env}]`);
        /* istanbul ignore else */
        if (pre) { hooks.preRun.push(pre); }
        post = get(PLUGINS, `[${plugin}]['postRun'][${env}]`);
        /* istanbul ignore else */
        if (post) { hooks.postRun.push(post); }
      } else {
        plugin.register(hooks);
      }
    });
    return hooks;
  }

  /**
   * Inits listeners to react to changed ComputationResult doc events
   * @private
   * @returns {Promise}
   */
  _initConsortiumListeners() {
    const tiaDB = this.dbRegistry.get('consortia');
    return tiaDB.all() // { include_docs: false }
    .then((docs) => {
      let willListenTo = docs;
      if (this.listenTo) {
        willListenTo = willListenTo.filter(doc => find(this.listenTo, d => d === doc._id));
      }
      return tiaDB.bulkGet(willListenTo);
    })
    .then((tia) => {
      this.listenToConsortia(tia);
    });
  }

  /**
   * @description instantiates or selects a PipelineRunner corresponding to the
   * new changed ComputationResult. runs the PipelineRunner with the new documents
   * @param {ComputationResult} result
   * @returns {null}
   */
  handleResultChange(result) {
    if (!(result instanceof ComputationResult)) {
      throw new ReferenceError('expected ComputationResult instance');
    }

    // // test for run conditions, prevent frivolous runs
    // @NOTE disable this feature. a user pipline and generate content in comp1,
    // then no-op in comp2, meaning the remote compute server never does
    // _anything_. instead, force the algorithms to be smart about their actions!
    // /* istanbul ignore if */
    // if (result.pipelineState && result.pipelineState.inProgress) {
    //   console.log(result);
    //   console.log('bananas');
    //   return null; // wait for pipeline to complete
    // }

    /* istanbul ignore next */
    if (result.data && result.data.complete) {
      this.events.emit(
        'computation:complete',
        result.runId,
        result.consortiumId
      );
      return null;
    }

    this.triggerRunner(result); // note, may be extended by child classes
    return null;
  }

  /**
   * @abstract
   * @private
   */
  _handleCreatedDB() {
    throw new ReferenceError([
      'abstract db created/destroyed handlers must be extended.',
      'db', arguments[0], 'created or destroyed' // eslint-disable-line
    ].join(' '));
  }

  /**
   * @description kickoff Pool activity
   * @returns {Promise}
   */
  init() {
    this.isDestroyed = false;
    this.isDestroying = false;
    this.isInitializing = true;
    this._handleCreatedDestroyedDBs();

    // open up DB connections, eventing begins immediately
    return this._syncDB('consortia')
    .then(() => this._syncDB('computations'))
    .then(() => {
      return this._initConsortiumListeners();
    })
    .then(() => {
      return this._listenForNewConsortia();
    })
    .then(() => {
      this.isInitializing = false;
      this.isInitialized = true;
      this.events.emit('ready');
      return this;
    });
  }

  /**
   * Configures Pool to listen for new consortia and begin handling
   * events from their local/remote results DBs
   * @private
   * @returns {undefined}
   */
  _listenForNewConsortia() {
    this.consortiaListener = new DBListener(this.dbRegistry.get('consortia'));
    this.consortiaListener.on('change', (result) => {
      if (this._shouldListenToConsortium(result.doc)) {
        this.listenToConsortia(result.doc);
      }
    });
  }

  /**
   * @description setup listeners on each consortium as required for
   * the env (e.g. local env, remote env)
   * @param {array|object} consortia raw consortia object(s)
   * @returns {DBListener[]}
   */
  listenToConsortia(consortia) {
    /* istanbul ignore next */
    if (!Array.isArray(consortia)) { consortia = [consortia]; }
    consortia = consortia.map((tium) => new Consortium(tium));
    /* istanbul ignore else */
    if (!consortia.length) { return []; }
    return consortia.map((tium) => this._listenToConsortium(tium));
  }

  /**
   * Configures consortium listener for remote _or_ local store.
   * exists to help `listenToConsortia`
   * @private
   * @param {Consortium} consortium
   * @returns {DBListener}
   */
  _listenToConsortium(consortium) {
    let db;
    const ResultDocType = this.listenToRemote ?
      RemoteComputationResult :
      LocalComputationResult;
    if (this.listenToRemote) {
      db = this.dbRegistry.get(`remote-consortium-${consortium._id}`);
    } else if (this.listenToLocal) {
      db = this.dbRegistry.get(`local-consortium-${consortium._id}`);
      /* istanbul ignore else */
    } else {
      /* istanbul ignore next */
      throw new ReferenceError([
        'PipelineRunnerPool must listen to database events on local or',
        'remote databases.  see `.listenToLocal` & `.listenToRemote`',
      ].join(' '));
    }
    /* istanbul ignore next */
    if (typeof this.resultsListeners[db.name] === DBListener) {
      throw new ReferenceError(`listener already exists for ${db.name}`);
    }
    const listener = new DBListener(db);
    listener.on(
      'change',
      (result) => this.handleResultChange(new ResultDocType(result.doc))
    );
    this.resultsListeners[db.name] = listener;
    this.events.emit('listener:created', db.name);
    if (this.listenTo) {
      const ndx = find(this.listenTo, consortium._id);
      if (!ndx) {
        this.listenTo.push(consortium._id);
      }
    }
    return listener;
  }

  /**
   * determine if the pool should listen to the consortium
   * @private
   * @param {Consoritum} tium
   * @returns {boolean}
   */
  _shouldListenToConsortium(tium) {
    if (!this.listenTo) {
      return true;
    }
    return !!find(this.listenTo, d => d === tium._id);
  }

  /**
   * @description destroy listeners on each consortium as required for
   * the env (e.g. local env, remote env)
   * @param {(string[]|string)} consortiaIds
   * @returns {Promise}
   */
  unlistenToConsortia(consortiaIds) {
    /* istanbul ignore next */
    if (!Array.isArray(consortiaIds)) { consortiaIds = [consortiaIds]; }
    /* istanbul ignore else */
    if (!consortiaIds.length) { return Promise.resolve([]); }
    return Promise.all(consortiaIds.map((id) => {
      let db;
      if (this.listenToRemote) {
        db = this.dbRegistry.get(`remote-consortium-${id}`);
      } else if (this.listenToLocal) {
        db = this.dbRegistry.get(`local-consortium-${id}`);
      }
      if (this.listenTo) {
        this.listenTo = without(this.listenTo, id);
      }

      return this.resultsListeners[db.name].destroy()
        .then(() => db.destroy());
    }));
  }

  /**
   * @description generates a DBListener for a results DB, provided the prefix
   * for that results db (e.g. local, remote), and the full db string as passed
   * by couch/pouch
   * @param {object} opts
   * @param {string} opts.listenToPrefix [local, remote] specified by child class
   *                                     if we are listening to a remote or local db
   * @param {string} opts.dbStr full db string as passed by couch/pouch on new db
   *                            event
   * @returns {Promise}
   */
  upsertListener(opts) {
    const dbStr = opts.dbStr;
    const prefix = opts.listenToPrefix;
    const doListenRE = new RegExp(`${prefix}-consortium-([^-]+)$`);
    if (!dbStr.match(doListenRE)) { return Promise.resolve(); }
    const _id = dbStr.match(doListenRE)[1];
    /* istanbul ignore if */
    if (!this.isActive) { return Promise.resolve(); }
    return this.dbRegistry.get('consortia').all()
    .then((consortia) => {
      // PouchDBs created/destroyed events are broken.
      // Early detect if a DBListener is created (or in processes)
      // @ref https://github.com/pouchdb/pouchdb/issues/4922
      /* istanbul ignore if */
      if (!consortia.length || !this.isActive) { return; }
      /* istanbul ignore else */
      if (this.resultsListeners[`${prefix}-consortium-${_id}`]) { return; }
      this.resultsListeners[`${prefix}-consortium-${_id}`] = 'constructing';
      const consortium = consortia.find(tium => tium._id.match(_id));
      this.listenToConsortia(consortium);
    });
  }

  /**
   * Synchronizes a db with the remote master.  some dbs
   * are restricted to up/ down/ only--these will not work.  although
   * dbs will auto-sync if configured, on init we sync some DBs fully
   * before completing initialization
   * @private
   * @param {string} dbname
   * @returns {Promise}
   */
  _syncDB(dbname) {
    let res;
    let rej;
    const p = new Promise((_res, _rej) => { res = _res; rej = _rej; });
    const db = this.dbRegistry.get(dbname);
    if (db._hasLikelySynced) { return Promise.resolve(); }
    /* istanbul ignore next */
    const handleSyncError = (err) => {
      db.syncEmitter.removeListener('hasLikelySynced', handleSyncError);
      db.syncEmitter.removeListener('error', handleSyncError);
      rej(err);
    };
    const handleLikelySynced = () => {
      db.syncEmitter.removeListener('hasLikelySynced', handleLikelySynced);
      db.syncEmitter.removeListener('error', handleSyncError);
      res();
    };
    /* istanbul ignore if */
    if (db.hasLikelySynced) { return handleLikelySynced(); }
    db.syncEmitter.on('hasLikelySynced', handleLikelySynced);
    db.syncEmitter.on('error', handleSyncError);

    this[dbname] = db;
    return p;
  }

  /**
   * @description triggers a PipelineRunner to react to new result document.
   * maintains a queue, permitting only a single pipeline to run at a time
   * within a specific runId group. e.g. two new results may queue, and
   * the PipelineRunner will run on each of them _in series_
   * @param {ComputationResult} result
   * @param {object=} userData user input that may conditionally be fed into
   *                           pipelines, as discerned by sub-classes
   * @returns {undefined}
   */
  triggerRunner(result, userData) {
    const runId = result.runId;

    // instantiate a processing queue for a decentralized computation run
    if (!this.runQueue[runId]) {
      this.runQueueSize[runId] = 0;
      this.events.emit('queue:start', runId);
      this.runQueue[runId] = bluebird.resolve();
    }

    // enter computation result into processing queue
    ++this.runQueueSize[runId];
    this.runQueue[runId] = this.runQueue[runId]
    .then(() => {
      --this.runQueueSize[runId];
      return bluebird.resolve(this._triggerRun({ result, userData }))
      .finally(() => {
        if (!this.runQueueSize[runId]) {
          this.events.emit('queue:end', runId);
          delete this.runQueue[runId];
        }
      });
    });
    return this.runQueue[runId];
  }

  /**
   * Call PipelineRunner::run with the newly detected result.
   * @private
   * @param {object} input
   * @param {ComputationResult} input.result
   * @param {object=} input.userData
   * @returns {Promise}
   */
  _triggerRun(input) {
    return this._prepareRunner(input.result)
    .then(() => this._run(input));
  }

  /**
   * Ensures that runner is instantiated to to support the run
   * @private
   * @param {ComputationResult} result
   * @returns {Promise<PipelineRunner>}
   */
  _prepareRunner(result) {
    const existingRunner = this.runners[result.runId];
    if (!existingRunner) {
      return this.createNewRunner(result)
      .then((runner) => {
        this.runners[result.runId] = runner;
        return runner;
      });
    }
    return Promise.resolve(existingRunner);
  }

  /**
   * Runs the env specific pipeline runner
   * @private
   * @param {object} input
   * @param {ComputationResult} input.result
   * @param {object=} input.userData
   * @returns {Promise}
   */
  _run(input) {
    let hasHalted = false;
    const result = input.result;
    const userData = input.userData;
    const runner = this.runners[result.runId];
    /* istanbul ignore if */
    if (!result) { throw new ReferenceError('missing result'); }

    // define event handlers to respond to **this run's activities**.
    // these handlers are bound pre-run, and unbound post-run
    const _runEmitInProgress = () => {
      this.events.emit('pipeline:inProgress');
    };
    const _runEmitRunEnd = (compRslt) => {
      this.events.emit('run:end', compRslt);
      if (compRslt.data && compRslt.data.complete) {
        this.events.emit(
          'computation:complete',
          compRslt.runId,
          compRslt.consortiumId
        );
      }
      configureRunBindings('removeListener'); // eslint-disable-line
      hasHalted = true;
    };
    const _runError = (err) => { throw err; };

    // provide utility for bulk binding/unbinding
    const configureRunBindings = (action) => {
      runner.pipeline.events[action]('inProgress', _runEmitInProgress);
      runner.events[action]('halt', _runEmitRunEnd);
      runner.events[action]('noop:noData', _runEmitRunEnd);
      runner.events[action]('noop:noStateChange', _runEmitRunEnd);
      runner.events[action]('noop:pendingKickoff', _runEmitRunEnd);

      // result didn't persist from run, crash. no recovery plan
      /* istanbul ignore next */
      runner.events[action]('error', _runError);
    };

    // bind handlers to runner
    configureRunBindings('addListener');
    this.events.emit('run:start', result);
    return runner.run(result, userData)
    .then((rslt) => {
      if (!hasHalted) { throw new Error('run exited, but pipleine has not halted'); }
      return rslt;
    });
  }

  /**
   * Handle created or destroyed dbs
   * @private
   * @returns {undefined}
   */
  _handleCreatedDestroyedDBs() {
    Pouchy.PouchDB.on('created', (dbName) => {
      if (!this.isActive) { return; }
      this._handleCreatedDB(dbName);
    });
    /* istanbul ignore next */
    Pouchy.PouchDB.on('destroyed', () => {
      if (!this.isActive) { return; }
      // @TODO define business logic. noop, perhaps
      // this._handleDestroyedDB(dbName);
    });
  }
}

PipelineRunnerPool.instanceCount = 0;

PipelineRunnerPool.schema = Object.assign({}, Base.schema, {
  computationRegistry: joi.object().required(),
  dbRegistry: joi.object().type(DBRegistry).required(),
  listenTo: joi.array(),
});

module.exports = PipelineRunnerPool;
