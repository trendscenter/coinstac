'use strict';

const PipelineRunner = require('./pipeline-runner.js');
const LocalComputationResult = require('../../computation/local-computation-result');
const Pouchy = require('pouchy');
const joi = require('joi');
const cloneDeep = require('lodash/cloneDeep');

/**
 * @class LocalPipelineRunner
 * @extends PipelineRunner
 * @description a LocalPipelineRunner, as all PipelineRunners, is run in the
 * context of a PipelineRunnerPool. it receives a db and a resultId, along with
 * the properties required by a PipelineRunner.  its primary role is to receive
 * events from the PipelineRunnerPool, trigger pipeline runs, and update its
 * result store with pipeline state & computation results
 */
class LocalPipelineRunner extends PipelineRunner {

  /**
   * @example
   * The following key-value pairs are passed into _each_ local computation:
   * {
   *     computationId: {string},
   *     consortiumId: {string},
   *     previousData: {*},
   *     remoteResult: {RemoteComputationResult},
   *     username: {string},
   *     userData: {*}
   * }
   * @description run the pipeline runner.  collects inputs for the pipeline,
   * runs the pipeline, and persists the pipeline and result state
   * @param {LocalComputationResult} lResult
   * @param {object=} userData
   * @returns {Promise}
   */
  run(remoteResult, userData) {
    let err;
    if (!remoteResult) {
      err = new ReferenceError(`remote result doc required, received ${remoteResult}`);
      this.events.emit('error', err);
      return Promise.reject(err);
    }
    if (remoteResult.complete) {
      err = new RangeError('illegal request to run pipeline on completed remoteResult doc');
      this.events.emit('error', err);
      return Promise.reject(err);
    }

    // permit the application of user data onto to the document
    // generally, this will _only_ occur when each user starts their
    // computation
    this.result.userData = this.result.userData || userData;

    if (this.result.userData === undefined) {
      this.events.emit('noop:pendingKickoff', this.result);
      return Promise.resolve(this.result);
    }

    // protect our runner's result from mutation
    // `JavascriptComputation`s are passed these inputs unserialized
    const resultCopy = cloneDeep(this.result);
    const payload = {
      computationId: resultCopy.computationId,
      consortiumId: resultCopy.consortiumId,
      previousData: resultCopy.data,
      remoteResult,
      username: resultCopy.username,
      userData: resultCopy.userData,
    };
    return this._runPipeline(payload);
  }
}

LocalPipelineRunner.schema = Object.assign({}, PipelineRunner.schema, {
  filenames: joi.array(),
  result: joi.object().type(LocalComputationResult).required(),
  db: joi.object().type(Pouchy).required(),
});

module.exports = LocalPipelineRunner;
