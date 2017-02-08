'use strict';

const common = require('../../../../');
const computations = common.models.computation;
const ComputationResult = computations.ComputationResult;
const RemoteComputationResult = computations.RemoteComputationResult;
const LocalComputationResult = computations.LocalComputationResult;
const Pipeline = common.models.pipeline.Pipeline;
const Pouchy = require('pouchy');
const assign = require('lodash/assign');

const dummyComputationResult = 'dummy-computation-result';

module.exports = {
  /**
   * @function basicOpts
   * @description helper to build a brand new PipelineRunner instantiation obj
   */
  basicOpts: function() {
    return {
      result: new ComputationResult({
        _id: 'runId-testUser',
        computationId: 'test-computation-id',
        consortiumId: 'test-consortium'
      }),
      pipeline: this.getPipeline()
    };
  },

  /**
   * @function getDB
   * @description helper to get a _new_ in-mem Pouhcy instance with hypothetical
   * COINSTAC DB name prefixing
   */
  getDB: function(name) {
    return new Pouchy({
      name: name,
      pouchConfig: { adapter: 'memory' }
    });
  },

  /**
   * @function getLocalResult
   * @description generates a dummy LocalComputationResult
   */
  getLocalResult: function(opts) {
    return new LocalComputationResult(assign(
      {
        _id: '12345-testuser',
        username: 'testuser',
        userData: 1,
        computationId: 'test_computation_id',
        consortiumId: 'test_consortium',
        pipelineState: { step: 0, inProgress: false }
      },
      opts
    ));
  },

  /**
   * @function getRemoteResult
   * @description generates a dummy RemoteComputationResult
   */
  getRemoteResult: function(opts) {
    return new RemoteComputationResult(assign(
      {
        _id: '12345',
        usernames: ['testuser'],
        computationId: 'test_computation_id',
        consortiumId: 'test_consortium',
        computationInputs: [[
          ['TotalGrayVol'],
          200,
        ]],
      },
      opts
    ));
  },

  /**
   * @function getPipeline
   * @description helper to retrieve basic pipeline instance
   */
  getPipeline: function() {
    var p = new Pipeline({
      computations: [
        new computations.JavascriptComputation({
          type: 'function',
          fn: (opts) => Promise.resolve(dummyComputationResult),
          cwd: __dirname
        })
      ]
    });
    p._result = dummyComputationResult;
    return p;
  },

  /**
   * @function getBustedPipeline
   * @description helper to retrieve basic pipeline that will error
   */
  getBustedPipeline: function() {
    return new Pipeline({
      computations: [
        new computations.JavascriptComputation({
          type: 'function',
          fn: (opts) => Promise.reject(new Error('test-error')),
          cwd: __dirname
        })
      ]
    });
  },

  /**
   * @function localOpts
   * @description helper to build a brand new PipelineRunner instantiation obj
   */
  localOpts: function() {
    return {
      result: this.getLocalResult(),
      pipeline: this.getPipeline(),
      db: this.getDB('local-consortium-test')
    };
  },

  /**
   * @function remoteOpts
   * @description helper to build a RemotePipelineRunner instantiation obj
   */
  remoteOpts: function() {
    return {
      result: this.getRemoteResult(),
      pipeline: this.getPipeline(),
      localDB: this.getDB('local-consortium-test_computation_id'),
      remoteDB: this.getDB('remote-consortium-test_computation_id'),
    };
  }
};
