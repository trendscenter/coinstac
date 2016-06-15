'use strict';

const Computation = require('../../../computation/computation');
const LocalComputationResult = require('../../../computation/local-computation-result');
const PipelineRunnerPool = require('./pipeline-runner-pool');
const Pipeline = require('../../pipeline');
const PipelineRunner = require('../pipeline-runner');
const LocalPipelineRunner = require('../local-pipeline-runner');
const User = require('../../../user');
const joi = require('joi');

/**
 * @abstract
 * @class LocalPipelineRunnerPool
 * @constructor
 * @extends PipelineRunnerPool
 * @description tailors a PipelineRunnerPool for execution on a client machine
 */
class LocalPipelineRunnerPool extends PipelineRunnerPool {

  /**
   * @protected
   * @description create a new PipelineRunner for the run proposed by the passed
   * computation result.
   * @param {RemoteComputationResult} rResult
   * @returns {Promise}
   */
  createNewRunner(rResult) {
    const runId = rResult.runId;
    const localResultDBName = `local-consortium-${rResult.consortiumId}`;
    const localDB = this.dbRegistry.get(localResultDBName);

    // get LocalComputationResult & DecentralizedComputation as inputs
    // to generate new LocalPipelineRunner instance
    return Promise.all([
      this.getLocalResult(localDB, runId, rResult),
      this.getDecentralizedComputation(rResult.computationId),
    ])
    .then((rslts) => {
      const lResult = rslts[0];
      const dComp = rslts[1];
      const computations = Computation.factory(dComp.local, { cwd: dComp.cwd });
      const plugins = this.getPipelinePlugins({ comp: dComp, env: 'local' });
      const runner = new LocalPipelineRunner({
        pipeline: new Pipeline({ computations, plugins }),
        result: lResult,
        db: localDB,
      });
      return runner;
    });
  }

  /**
   * @description searches for an existing local computation result for this run
   * and cb's. cbs with an instantiated result, or undefined
   * @param {Pouchy} db
   * @param {string} runId
   * @returns {Promise}
   */
  getLatestResult(db, runId) {
    return PipelineRunner.prototype.findResultByRunId(db, runId)
    .then((doc) => {
      /* istanbul ignore next */
      if (doc) { return new LocalComputationResult(doc); }
      return null;
    });
  }

  /**
   * @description gets (revives) or instantiates a LocalComputationResult
   * associated with this run
   * @param {Pouchy} db local-consortium-{xzy} results db
   * @param {string} runId
   * @param {RemoteComputationResult} rResult
   * @returns {Promise}
   */
  getLocalResult(db, runId, rResult) {
    return this.getLatestResult(db, runId)
    .then((localResult) => {
      /* istanbul ignore next */
      if (localResult) { return localResult; }
      /* istanbul ignore next */
      return new LocalComputationResult({
        _id: `${runId}-${this.user.username}`,
        computationId: rResult.computationId,
        consortiumId: rResult.consortiumId,
        username: this.user.username,
      });
    });
  }

  /**
   * @private
   * @extends PipelineRunnerPool::_handleCreatedDB
   * @description listens to events on _remote_ dbs to trigger Pipeline
   * activity locally
   * @todo listen only to dbs that i am a member of
   * @todo kill listeners _and_ unregister dbs from consortia that i leave
   */
  /* istanbul ignore next */
  _handleCreatedDB(dbStr) {
    // tested via remote runner
    this.upsertListener({ dbStr, listenToPrefix: 'remote' });
  }
}

LocalPipelineRunnerPool.schema = Object.assign({
  user: joi.object().type(User).required(),
  listenToRemote: joi.boolean().default(true),
}, PipelineRunnerPool.schema);

module.exports = LocalPipelineRunnerPool;
