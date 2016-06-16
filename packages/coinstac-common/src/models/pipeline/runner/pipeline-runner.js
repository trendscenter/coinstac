'use strict';

const Base = require('../../base');
const EventEmitter = require('events').EventEmitter;
const Pipeline = require('../pipeline');
const ComputationResult = require('../../computation/computation-result');
const joi = require('joi');
const assign = require('lodash/assign');
const extractRunId = ComputationResult.prototype._extractRunId;

/**
 * @abstract
 * @class PipelineRunner
 * @extends Base
 * @description responds to events from a PipelineRunnerPool.  specifically, it
 * collects the latest document state from local result and/or remote result
 * stores, and triggers Pipeline activity.  PipelineRunner both initiates
 * the running of a Pipeline and it "awakens" a halted Pipeline by calling
 * Pipeline.run.  Pipeline.run is called only when the PipelineRunner _itself_
 * has been awakend by the PipelineRunnerPool, and once it has finished
 * collecting a Pipeline's required inputs.  Lastly, the PipelineRunner is
 * responsible for persisting the computation results and pipeline state.
 * @property {EventEmitter} events
 * @property {Pipeline} pipeline
 * @property {ComputationResult} result
 */
class PipelineRunner extends Base {
  constructor(opts) {
    super(opts);
    this.events = new EventEmitter();
    this.events.setMaxListeners(20);
    this.pipeline.events.on('save-request', this._handleSaveRequest.bind(this));
  }

  /**
   * PipelineRunner does not persist state after run completes, as the
   * computation returned undefined/null
   *
   * @event PipelineRunner#noop:noData
   * @type {ComputationResult}
   */

  /**
   * @description get previous result data from db
   * @param {Pouchy} db
   * @returns {Promise} Resolves to a data object or null
   */
  getPreviousResultData(db) {
    /* istanbul ignore next */
    if (!db) { throw new ReferenceError('missing db'); }
    const runId = extractRunId(this.result._id);
    return this.findResultByRunId(db, runId)
    .then((doc) => {
      if (!doc) { return null; }
      return doc.data;
    });
  }

  /**
   * @description finds all result docs in a provided db matching provided runId
   * @param {Pouchy} db
   * @param {string} runId
   * @returns {Promise}
   */
  getResultDocs(db, runId) {
    const re = new RegExp(`^${runId}`);

    // db.all({ include_docs: false })
    // .then(lightDocs => lightDocs.filter(lDoc => lDoc._id.match(re)))
    // .then(lightDocs => db.bulkGet(lightDocs))
    // .then(docs => cb(null, docs))
    // .catch(cb);
    // @TODO get bulkGet ^^ working for improved efficency (`.all()` ==> heavy)
    return db.all()
    .then((docs) => docs.filter(doc => doc._id.match(re)));
  }

  /**
   * Write pipeline results to db.
   * @private
   * @param {ComputationResult} rslt local or remote.
   * @returns {Promise}
   */
  _handleSaveRequest(rslt, err, force) {
    // local runners only write results to `runner.db`, and
    // remote runners only write results to `runner.remoteDB`, hence we can
    // objectively select which db to write to by existence of attrs on the runner
    const db = this.db || this.remoteDB;
    /* istanbul ignore if */
    if (!db) {
      throw new ReferenceError('expected db to write computation results into');
    }
    return this.saveResult(db, rslt, err, force);
  }

  /**
   * complete a pipeline run or run attempt.
   * @returns {Promise}
   */
  _flush() {
    return (this._saveQueue || Promise.resolve()) // wait for saves to settle out
    .then(() => {
      this.events.emit('halt', this.result);
      return this.result;
    });
  }

  /**
   * @description finds a result document matching the provided runId in the
   *              provided db
   * @param {Pouchy} db
   * @param {string} runId
   * @param {cb} cb(err, {null|object})
   * @returns {Promise}
   */
  findResultByRunId(db, runId) {
    return db.all({ include_docs: false })
    .then((docs) => docs.find(doc => doc._id.match(runId)))
    .then((doc) => {
      if (!doc) { return Promise.resolve(); }
      return db.get(doc._id);
    });
  }

  _generateResultPatch(runData, runError) {
    const patch = {
      pipelineState: {
        inProgress: this.pipeline.inProgress,
        step: this.pipeline.step,
      },
      pluginState: this.result.pluginState,
    };

    // squash data state only when a computation returns data
    if (runData !== null && runData !== undefined) {
      assign(patch, { data: runData });
    }

    // apply `error` state _only_ when the most recent run has errored
    delete this.result.error;
    if (runError) {
      assign(patch, {
        error: {
          message: runError.message,
          stack: runError.stack,
        },
      });
    }
    return patch;
  }

  /**
   * @description updates or creates the result doc for a user provided
   * db with the data returned from the pipeline computation
   * @note we queue saveResult requests to ensure that prior state has
   * saved before next pipeline state attemps to save
   * @param {Pouchy} db
   * @param {object} runData computation response
   * @param {Error} runError runtime Error
   * @param {function} force persist even when data & error content are empty.
   *                         useful when pipelineState or pluginState may demand
   *                         persistence
   * @returns {Promise}
   */
  saveResult(db, runData, runError, force) {
    /* istanbul ignore if */
    if (!db) { throw new ReferenceError('saveResult requires a db'); }

    const isNoOp = !force && !runError && (runData === null || runData === undefined);

    // for simplicity sake, always save on first request.
    // don't bother persisting if no data or no error occurred
    // this is how we support algorithms that say "noop"
    if (this.result._rev && isNoOp) {
      this.events.emit('noop:noData', this.result);
      return Promise.resolve(this.result);
    }

    // define how our ComputationResult has changed in the form of a `patch`
    const patch = this._generateResultPatch(runData, runError);
    if (!this._saveQueue) { this._saveQueue = Promise.resolve(); }
    this._saveQueue = this._saveQueue.then(() => this._saveResult(db, patch));
    return this._saveQueue;
  }

  /**
   * See `saveResult`.  `saveResult` is the interface for saving
   * a result, however, merely stages result save requests into the save queue
   * @private
   * @param {Pouchy} db
   * @param {object} patch key value pairs to update our current result doc with
   * @returns {Promise}
   */
  _saveResult(db, patch) {
    /* istanbul ignore next */
    if (!db) { return new ReferenceError('PipelineRunner saveResult requires db'); }
    /* istanbul ignore next */
    if (!patch) { return new ReferenceError('PipelineRunner saveResult requires result patch'); }

    // find DB copy of our result document, then patch it
    const runId = extractRunId(this.result._id);
    return this.findResultByRunId(db, runId)
    .then((doc) => this._updateResult(db, patch, doc))
    .catch((err) => {
      this.events.emit('error', err);
      throw err;
    });
  }

  /**
   * Handles case where we were requested to save/update a result
   * document, but none was found.  this case is _expected_ each time we kick of
   * a Pipeline cycle in any environment, as no result exists on init
   * @private
   * @param {Pouchy} db
   * @param {object} patch document
   * @param {function} cb
   * @returns {Promise}
   * @throws when we have thought to already seeded a result doc, but none found
   */
  _handleNoResult(db, patch) {
    if (this.hasPersistedResult) {
      return Promise.reject(new ReferenceError(
        `no result document match found for doc _id ${this.result._id}`
      ));
    }

    // set `hasPersistedResult` early to prevent race condition
    // if multiple db events enter the system rapidly. e.g. set this bool
    // syncronously in _this_ event loop cycle, so subsequent events see
    // accurate PipelineRunner state.
    this.hasPersistedResult = true;
    assign(this.result, patch);
    return this._persistResult(db);
  }

  /**
   * Persists the result to the db.
   * @private
   * @param {Pouchy} db
   * @returns {Promise}
   */
  _persistResult(db) {
    return db.save(this.result.serialize())
    .then((doc) => {
      this.result._rev = doc._rev; // update our cached result
      return this.result;
    });
  }

  /**
   * Patches the latest ComputationResult with state from
   * last run, then persists
   * @private
   * @param {Pouchy} db
   * @param {object} patch
   * @param {object} doc
   * @returns {Promise}
   */
  _updateResult(db, patch, doc) {
    if (!doc) {
      /* istanbul ignore if */
      if (this.result._rev) {
        throw new ReferenceError('result document not found, yet result has a _rev');
      }
      return this._handleNoResult(db, patch);
    }

    /* istanbul ignore if */
    if (
      this.result.username && doc.username && this.result.username !== doc.username
    ) {
      throw new ReferenceError(
        'conflicting usernames exist. stores are not wired properly'
      );
    }

    // build result history on existing results
    this.hasPersistedResult = true;
    assign(this.result, doc, patch);
    if (doc.data !== undefined && doc.data !== null) {
      this.result.history = doc.history.concat(doc.data);
    }
    return this._persistResult(db);
  }

  /**
   * @abstract
   * @description PipelineRunner subtypes must provide a run function taking
   * a changed document as input, conditionally used by `Pipeline`s to decide
   * how to progress/run the Pipeline itself
   * @throws {ReferenceError} always.
   */
  run() {
    throw new ReferenceError('abstract PipelineRunner must be extended');
  }

  /**
   * Common pipeline run bindings for local and remote runners.
   * @private
   * @param {object} payload
   * @returns {Promise}
   */
  _runPipeline(payload) {
    return this.pipeline.run(payload, this.result)
    .catch((err) => {
      // @note `err` in a pipeline run shouldn't kill our process
      // instead, we sync it into our result
      this.events.emit('error', err);
      return this.saveResult(this.db || this.remoteDB, null, err);
    })
    .then(this._flush.bind(this));
  }
}

PipelineRunner.schema = Object.assign({}, Base.schema, {
  hasPersistedResult: joi.boolean().default(false),
  pipeline: joi.object().type(Pipeline),
  result: joi.object().type(ComputationResult).required(),
});

module.exports = PipelineRunner;
