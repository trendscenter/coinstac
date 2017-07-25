'use strict';

const PipelineRunner = require('./pipeline-runner.js');
const RemoteComputationResult = require('../../computation/remote-computation-result');
const Pouchy = require('pouchy');
const joi = require('joi');
const isEqual = require('lodash/isEqual');
const cloneDeep = require('lodash/cloneDeep');

/**
 * @class RemotePipelineRunner
 * @extends PipelineRunner
 * @description a RemotePipelineRunner, as all PipelineRunners, is run in the
 * context of a PipelineRunnerPool. it receives a local results db and a remote
 * results db, along with along with all additional properties required by a
 * PipelineRunner.  its primary role is to receive events from a
 * RemotePipelineRunnerPool, trigger pipeline runs, and update its remote result
 * store with pipeline state & computation result.
 * @property {array} userResultState _id & _rev of all user results for a
 *                                   run, so as to prevent redundant computation
 */
class RemotePipelineRunner extends PipelineRunner {

  /**
   * PipelineRunner does not run the pipeline because user results have not
   * changed since last run.  This occurs because results appear in the result
   * store asynchronously
   *
   * @event PipelineRunner#noop:noStateChange
   * @type {ComputationResult}
   */

  /**
   * @example
   * The following key-value pairs are passed into _each_ remote computation:
   * {
   *     computationId: {string},
   *     consortiumId: {string},
   *     previousData: {*},
   *     usernames: {string[]},
   *     userResults: {LocalComputationResult[]},
   * }
   * @description run the pipeline runner.  collects inputs for the pipeline,
   * runs the pipeline, and persists the pipeline and result state
   * @param {LocalComputationResult} lResult
   * @returns {Promise}
   */
  run(lResult) {
    if (!lResult) {
      return this.events.emit('error', new ReferenceError(
        `local result doc required, received ${lResult}`
      ));
    }

    // TODO: Consider chaining on _saveQueue
    // return (this._saveQueue ? this._saveQueue : Promise.resolve())
    return Promise.all([
      this.getResultDocs(this.localDB, lResult.runId),
      this.getPreviousResult(this.remoteDB),
    ])
    .then(([userResults, { prevData, pluginState }]) => {
      // // test for run conditions, prevent frivolous runs
      // /* istanbul ignore if */
      // if (userResults.some((d) => d.pipelineState.inProgress)) {
      //   return this.events.emit('noop:noStateChange', this.result);
      // }
      const resultState = userResults.map(d => ({ _id: d._id, _rev: d._rev })).sort();
      if (isEqual(this.userResultState, resultState)) {
        // no state change, don't rerun pipeline
        return this.events.emit('noop:noStateChange', this.result);
      }
      this.userResultState = resultState;

      this.result.userErrors = RemotePipelineRunner.getUserErrors(userResults);
      if (this.result.userErrors.length) {
        return this.saveResult(this.remoteDB, null, null, true)
        .then(this._flush.bind(this));
      }

      return this._run({ userResults, pluginState, prevData });
    });
  }

  /**
   * @private
   * @description see `.run`. the `.run` interface is a facade that only collects
   * the inputs needed to run. `._run` actually runs the computation
   * @param {object} inputs
   * @param {object[]} inputs.userResults all userland computation results (raw)
   * @param {(Object|null)} inputs.pluginState
   * @param {(Object|null} inputs.prevData previous remote computation result
   * @returns {Promise}
   */
  _run(inputs) {
    return this._runPipeline({
      computationId: this.result.computationId,
      consortiumId: this.result.consortiumId,
      pluginState: inputs.pluginState,
      previousData: inputs.prevData,
      usernames: cloneDeep(this.result.usernames),
      userResults: inputs.userResults,
    });
  }

  /**
   * generate set of user Errors provided user `LocalComputationResult` set.
   * @param {LocalComputationResult[]} userResults
   * @returns {object[]} serialized error objects
   */
  static getUserErrors(userResults) {
    const errors = [];
    userResults.forEach((uR) => {
      /* istanbul ignore if */
      if (!uR.error) { return; }
      errors.push(uR.error);
    });
    return errors;
  }
}

RemotePipelineRunner.schema = Object.assign({}, PipelineRunner.schema, {
  result: joi.object().type(RemoteComputationResult).required(),
  localDB: joi.object().type(Pouchy).required(),
  remoteDB: joi.object().type(Pouchy).required(),
});

module.exports = RemotePipelineRunner;
