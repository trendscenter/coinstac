'use strict';

const Base = require('../base.js');
const Computation = require('../computation/computation.js');
const assign = require('lodash/assign');
const noop = require('lodash/noop');
const joi = require('joi');
const EventEmitter = require('events');

/**
 * Emits a request for the PipelineRunner to save a PipelineResult
 *
 * @event Pipeline#save-request
 * @param {ComputationResult} rslt
 * @param {Error} [err] run error
 * @param {boolean} [force] force saving of result document
 */

/**
 * @class Pipeline
 * @constructor
 * @extends Base
 * @param {object} opts
 * @param {Computation[]} opts.computations
 * @property {Computation[]} computations computations in Pipeline
 * @property {number} step current integer step
 * @property {Computation} computation current computation instance
 * @property {boolean} inProgress state indicating that Pipeline is active
 * @property {EventEmitter} events
 */
class Pipeline extends Base {

  constructor(opts) {
    super(opts);
    this.events = new EventEmitter();
    this.computation = this.computations[this.step];
    this._preRunTasks = [];
    this._postRunTasks = [];
    this._applyDefaultPlugins();
  }

  /**
   * import/convert string plugin requests into actual plugin functions
   * @private
   * @returns {undefined}
   */
  _applyDefaultPlugins() {
    if (this.plugins && this.plugins.preRun.length) {
      this._preRunTasks = this.plugins.preRun;
    }
    if (this.plugins && this.plugins.postRun.length) {
      this._postRunTasks = this.plugins.postRun;
    }
  }

  /**
   * run any plugins post-run (each step)
   * @private
   * @param {object} opts
   * @param {object} opts.runOutput computation output
   * @param {ComputationResult} opts.compResult
   * @param {object} opts.pluginHooks
   * @returns {Promise}
   */
  _postRunPlugins(opts) {
    const runOutput = opts.runOutput;
    const compResult = opts.compResult;
    const pluginHooks = opts.pluginHooks;
    if (!this._postRunTasks.length) { return Promise.resolve(); }
    return Promise.all(
      this._postRunTasks.map((fn) => fn(runOutput, compResult, pluginHooks))
    );
  }

  /**
   * run any plugins pre-run (each step)
   * @private
   * @param {object} opts
   * @param {object} opts.runInputs computation input
   * @param {ComputationResult} opts.compResult
   * @param {object} opts.pluginHooks
   * @returns {Promise}
   */
  _preRunPlugins(opts) {
    const runInputs = opts.runInputs;
    const compResult = opts.compResult;
    const pluginHooks = opts.pluginHooks;
    if (!this._preRunTasks.length) { return Promise.resolve(); }
    return Promise.all(
      this._preRunTasks.map((fn) => {
        if (!pluginHooks.isRunCancelled()) {
          return fn(runInputs, compResult, pluginHooks);
        }
        return noop;
      })
    );
  }

  /**
   * @description run the pipeline from its current state, feeding in inputs
   * provided by the pipeline caller
   * @param {object} runInputs object that is fed to the computation, provided by
   *                      the pipeline runner
   * @param {ComputationResult} compResult the ComputationResult for the environment.
   *                                @note this should only be touched by plugins.
   * @returns {Promise}
   */
  run(runInputs, compResult) {
    if (!runInputs || !compResult) {
      return Promise.reject(
        new ReferenceError('options & ComputationResult required to pass to computations')
      );
    }
    if (this.inProgress) {
      return Promise.reject(
        new Error([
          'pipelines do not permit concurrent running. please spawn a new',
          'pipeline instance if concurrency is required',
        ].join(' '))
      );
    }
    this.inProgress = true;
    this.computation = this.computations[this.step];
    let runCancelled = false;
    let forceSave = false;
    // offer plugin hooks as functions.  restrict plugins from meddling with
    // run state. simply expose some run modifiers.
    const pluginHooks = {
      isRunCancelled() { return runCancelled; },
      cancelRun() { runCancelled = true; },
      forceSave() { forceSave = true; },
    };
    return this.tryNext(runInputs, { preRun: true })
    .then(() => this.events.emit('computation:start', runInputs))
    .then(() => this._preRunPlugins({ runInputs, compResult, pluginHooks }))
    .then(() => {
      if (runCancelled) { return Promise.resolve(null); }
      return this.computation.run(runInputs);
    })
    .then((runOutput) => {
      if (runCancelled) { return Promise.resolve(runOutput); }
      // postRun plugins are only run if a computation _actually_ ran
      return this._postRunPlugins({ runOutput, compResult, pluginHooks })
      .then(() => runOutput);
    })
    .then((runOutput) => this._postRun({
      runInputs,
      runOutput,
      compResult,
      runCancelled,
      forceSave,
    }))
    .catch((err) => {
      this.inProgress = false;
      if (err) { err.isRunError = true; }
      throw err;
    });
  }

  /**
   * Executes pipeline activity following a completed (successful or
   * not) computation run.
   * @private
   * @param {Error|null} err
   * @param {object} opts
   * @param {object} opts.runInputs original opts passed to run
   * @param {object} opts.runRslt
   * @param {ComputationResult} opts.compResult the ComputationResult for the environment.
   *                                @note this should only be touched by plugins.
   * @param {boolean} opts.forceSave
   * @param {boolean} opts.runCancelled
   * @returns {Promise}
   */
  _postRun(opts) {
    const runInputs = opts.runInputs;
    const runOutput = opts.runOutput;
    const compResult = opts.compResult;
    const forceSave = opts.forceSave;
    const runCancelled = opts.runCancelled;

    this.events.emit('computation:end', runInputs);
    let postRunInputs = assign({}, runInputs, { previousData: runOutput });
    return (runCancelled ?
      Promise.resolve({ didStep: false }) :
      this.tryNext(postRunInputs, { postRun: true })
    )
    .then((stepRslt) => {
      // set `inProgress` to represent whether we are about to be inProgress
      // again (e.g. if pipeline will run again). in this regard cb()s get
      // accurate depiction of state
      this.inProgress = !!stepRslt.didStep;
      this.events.emit('save-request', runOutput, null, forceSave);
      this.inProgress = false; // reset
      if (stepRslt.didStep) {
        this.events.emit('inProgress', runOutput);
        return this.run(postRunInputs, compResult);
      }
      return runOutput;
    });
  }

  /**
   * @extends Base::serialize
   * @description serialize a Pipeline per standard serialization,
   * however remove hefty computaton definitions
   * @returns {object}
   */
  serialize() {
    let serialized = Base.prototype.serialize.call(this);
    delete serialized.computations;
    return serialized;
  }

  /**
   * Attempt to bump the pipeline step.  runs the `next` computation
   * if present, and conditionally bumps the pipeline state. to be clear, this
   * runs a computation's `next` computation, _not the next step in the pipeline_
   *
   * if tryNext is called pre-`run` (`cycle.preRun`) and no `next` is defined,
   * the pipeline will **not progress** its current computation index.
   *
   * if tryNext is called post-`run` (`cycle.postRun`) and no `next` is defined,
   * the pipeline **will progress** its current computation index.
   *
   * @private
   * @param {object} opts inputs to next computation
   * @param {object} cycle
   * @param {boolean=} cycle.preRun tryNext is being called before `run` is called
   * @param {boolean=} cycle.postRun tryNext is being called after `run` is called
   * @returns {Promise}
   */
  tryNext(opts, cycle) {
    let resp = { didStep: false };
    const handleNextComplete = (doNext) => {
      const endOfPipe = !this.computations[this.step + 1];
      if (doNext && !endOfPipe) {
        ++this.step;
        this.computation = this.computations[this.step];
        resp.didStep = true;
      }
      return resp;
    };
    if (this.computation.next) {
      return this.computation.next.run(opts)
      .then((doNext) => handleNextComplete(doNext));
    }
    // do not auto-progress w/out .next fn on-pre-run
    if (cycle.preRun) { return Promise.resolve(resp); }
    return Promise.resolve(handleNextComplete(true));
  }
}

Pipeline.schema = Object.assign({}, Base.schema, {
  computations: joi.array().min(1).items(joi.object().type(Computation)).required(),
  plugins: joi.object().keys({
    preRun: joi.array().items(joi.func()),
    postRun: joi.array().items(joi.func()),
  }), // @TODO add shapel { preRun: [], postRun: [] }
  inProgress: joi.boolean().default(false),
  step: joi.number().integer().default(0), // current computation step
});

module.exports = Pipeline;
