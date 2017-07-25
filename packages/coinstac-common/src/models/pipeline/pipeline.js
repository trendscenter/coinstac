'use strict';

const assign = require('lodash/assign');
const debug = require('debug')('coinstac:pipeline');
const noop = require('lodash/noop');
const joi = require('joi');
const EventEmitter = require('events');

const Base = require('../base.js');
const Computation = require('../computation/computation.js');

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
      this._postRunTasks.map(fn => fn(runOutput, compResult, pluginHooks))
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
   * Run.
   * @description Run the pipeline from its current state, feeding in inputs
   * provided by the pipeline caller
   *
   * @param {Object} runInputs Input passed to the computation, provided by the
   * pipeline runner.
   * @param {ComputationResult} compResult Environment-specific
   * ComputationResult. This should only be touched by plugins.
   * @returns {Promise}
   */
  run(runInputs, compResult) {
    if (!runInputs || !compResult) {
      return Promise.reject(new Error(
        'Run inputs and ComputationResult required to pass to computations'
      ));
    } else if (this.inProgress) {
      return Promise.reject(new Error(
        /* eslint-disable max-len */
        'Pipelines do not permit concurrent running. Please spawn a new pipeline instance if concurrency is required.'
        /* eslint-enable max-len */
      ));
    }

    this.inProgress = true;
    this.computation = this.computations[this.step];
    let forceSave = false;
    let shouldContinueRun = true;

    debug(`starting run, step ${this.step}`);

    /**
     * Offer plugin hooks as functions. Restrict plugins from meddling with
     * run state: simply expose some run modifiers.
     */
    const pluginHooks = {
      isRunCancelled() {
        return !shouldContinueRun;
      },
      cancelRun() {
        debug('run canceled');
        shouldContinueRun = false;
      },
      forceSave() {
        debug('force save');
        forceSave = true;
      },
    };

    return this.maybeIncrementStep(runInputs, true)
      .then(() => {
        this.events.emit('computation:start', runInputs);
        debug(`pre-run plugins, step ${this.step}`);
        return this._preRunPlugins({ runInputs, compResult, pluginHooks });
      })
      .then(() => {
        if (shouldContinueRun) {
          debug(`running computation, step ${this.step}`);
          return this.computation.run(runInputs);
        }
      })
      .then((runOutput) => {
        if (shouldContinueRun) {
          // postRun plugins are only run if a computation _actually_ ran
          debug(`post-run plugins, step ${this.step}`);
          return Promise.all([
            runOutput,
            this._postRunPlugins({ runOutput, compResult, pluginHooks }),
          ]);
        }
        return [runOutput];
      })
      .then(([runOutput]) => this._postRun({
        runInputs,
        runOutput,
        compResult,
        runCancelled: !shouldContinueRun,
        forceSave,
      }))
      .catch((error) => {
        debug(`run error: ${error.message}`);
        this.inProgress = false;
        error.isRunError = true;
        throw error;
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
    const postRunInputs = assign({}, runInputs, { previousData: runOutput });
    return (runCancelled ?
      Promise.resolve(false) :
      this.maybeIncrementStep(postRunInputs, false)
    )
    .then((didIncrementStep) => {
      // set `inProgress` to represent whether we are about to be inProgress
      // again (e.g. if pipeline will run again). in this regard cb()s get
      // accurate depiction of state
      this.inProgress = !!didIncrementStep;
      this.events.emit('save-request', runOutput, null, forceSave);
      this.inProgress = false; // reset
      if (didIncrementStep) {
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
    const serialized = Base.prototype.serialize.call(this);
    delete serialized.computations;
    return serialized;
  }

  /**
   * Maybe increment the pipeline's step.
   *
   * This method increments the pipeline's `step` property based on a few
   * conditions:
   *
   * * If `isPreRun` is `true` and the computation has no `.next` property **do
   *   not increment**.
   * * If `isPreRun` is `false` and the computation has no `.next` property **do
   *   increment**.
   * * If a `.next` property exists pass `opts`. The `.next` computation should
   *   return a boolean value indicating whether the pipeline should increment
   *   its step.
   * * Don't increment if there's no more computations to run.
   *
   * @private
   * @param {Object} opts Inputs to next computation
   * @param {boolean} [isPreRun=false] Whether method is called before
   * `Pipeline#run` is called
   * @returns {Promise<boolean>} Value representing whether the pipeline
   * instance's `step` property was incremented and its `computation` property
   * was updated: `true` indicates incrementation occurred, `false` indicates no
   * change.
   */
  maybeIncrementStep(opts, isPreRun) {
    const handleNextComplete = (doNext) => {
      if (doNext && this.computations[this.step + 1]) {
        this.step += 1;
        this.computation = this.computations[this.step];

        return true;
      }

      return false;
    };

    if (this.computation.next) {
      return this.computation.next.run(opts).then(handleNextComplete);
    } else if (isPreRun) {
      // do not auto-progress w/out .next fn on-pre-run
      return Promise.resolve(false);
    }

    return Promise.resolve(handleNextComplete(true));
  }
}

Pipeline.schema = Object.assign({}, Base.schema, {
  computations: joi.array().min(1).items(joi.object().type(Computation))
    .required(),
  plugins: joi.object().keys({
    preRun: joi.array().items(joi.func()),
    postRun: joi.array().items(joi.func()),
  }), // @TODO add shapel { preRun: [], postRun: [] }
  inProgress: joi.boolean().default(false),
  step: joi.number().integer().default(0), // current computation step
});

module.exports = Pipeline;
