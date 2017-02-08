'use strict';

const RemoteComputationResult = require('../../../computation/remote-computation-result');
const RemotePipelineRunner = require('../remote-pipeline-runner');
const PipelineRunnerPool = require('./pipeline-runner-pool');
const PipelineRunner = require('../pipeline-runner');
const Pipeline = require('../../pipeline');
const Computation = require('../../../computation/computation');
const joi = require('joi');

/**
 * @abstract
 * @class RemotePipelineRunnerPool
 * @constructor
 * @extends PipelineRunnerPool
 * @description tailors a PipelineRunnerPool for execution on a client machine
 */
class RemotePipelineRunnerPool extends PipelineRunnerPool {
  /**
   * @see PipelineRunnerPool#constructor
   * @param {Object} opgs
   */
  constructor(opts) {
    super(opts);
    this.events.on(
      'computation:complete',
      this._handleComputationComplete.bind(this)
    );
  }

  /**
   * @protected
   * @description create a new PipelineRunner for the run proposed by the passed
   * computation result.
   * @param {LocalComputationResult} lResult
   * @returns {Promise}
   */
  createNewRunner(lResult) {
    const localResultDBName = `local-consortium-${lResult.consortiumId}`;
    const remoteResultDBName = `remote-consortium-${lResult.consortiumId}`;
    const localDB = this.dbRegistry.get(localResultDBName);
    const remoteDB = this.dbRegistry.get(remoteResultDBName);

      // get RemoteComputationResult & DecentralizedComputation as inputs
      // to generate new RemotePipelineRunner instance
    return Promise.all([
      this.getRemoteResult(remoteDB, lResult),
      this.getDecentralizedComputation(lResult.computationId),
    ])
    .then((rslts) => {
      const rResult = rslts[0];
      const dComp = rslts[1];
      const computations = Computation.factory(dComp.remote, { cwd: dComp.cwd });
      const plugins = this.getPipelinePlugins({ comp: dComp, env: 'remote' });
      const runner = new RemotePipelineRunner({
        pipeline: new Pipeline({ computations, plugins }),
        result: rResult,
        localDB,
        remoteDB,
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
      if (doc) { return new RemoteComputationResult(doc); }
      return null;
    });
  }

  /**
   * @description gets (revives) or instantiates (seeds) a RemoteComputationResult
   * associated with this run
   * @param {Pouchy} db remote-consortium-{xzy} results db
   * @param {LocalComputationResult} lResult
   * @returns {Promise}
   */
  getRemoteResult(db, lResult) {
    const runId = lResult.runId;
    return this.getLatestResult(db, runId)
    .then((rResult) => {
      if (rResult) { return rResult; }
      return this.buildNewRemoteResult(lResult);
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
  _handleCreatedDB(dbStr) {
    this.upsertListener({ dbStr, listenToPrefix: 'local' });
  }

  /**
   * Handle a computation completion.
   * @private
   *
   * @param {string} runId
   * @param {string} consortiumId
   */
  _handleComputationComplete(runId, consortiumId) {
    const db = this.dbRegistry.get(`remote-consortium-${consortiumId}`);

    db.get(runId)
      .then(compResult => {
        compResult.complete = true;
        compResult.endDate = Date.now();
        return db.save(compResult);
      })
      .then(() => {
        this.events.emit('computation:markedComplete', runId, consortiumId);
      })
      .catch(error => {
        this.events.emit('error', error);
      });
  }

  /**
   * @description generates a new RemoteComputationResult to match that requested
   * from the provided LocalComputationResult.
   * @note this _LOCKS IN_ all current consortium members into the run
   * @param {LocalComputationResult} lResult
   * @returns {Promise}
   */
  buildNewRemoteResult(lResult) {
    const runId = lResult.runId;
    const consortiumId = lResult.consortiumId;
    const computationId = lResult.computationId;
    return this.dbRegistry.get('consortia').get(consortiumId)
    .then(({ activeComputationInputs, users }) => new RemoteComputationResult({
      _id: runId,
      computationId,
      computationInputs: activeComputationInputs,
      consortiumId,
      usernames: users,
    }));
  }
}

RemotePipelineRunnerPool.schema = Object.assign(
    {},
    PipelineRunnerPool.schema,
    { listenToLocal: joi.boolean().default(true) }
);

module.exports = RemotePipelineRunnerPool;
