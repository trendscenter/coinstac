'use strict';

const joi = require('joi');
const memoize = require('lodash/memoize');
const PouchDocument = require('../pouch-document');

/**
 * @abstract
 * @class ComputationResult
 * @extends PouchDocument
 * @description Generic ComputationResult result container.
 * @property {*} data
 * @property {object} pipelineState snapshot of latest pipeline state
 * @property {string} computationId _id of computation definition executed
 * @property {string} runId non-persisted attr used as the unique identifier for
 *                          the associated decentralized computation run
 * @property {RegExp} _idRegex non-persisted attr used to derive the runId
 *                             from the `_id` property. must be extended by
 *                             child classes
 */
class ComputationResult extends PouchDocument {
  constructor(attrs) {
    super(attrs);
    this._configureRunId();
  }

  /**
   * @private
   * @description sets a read-only attribute `runId` on the provided context
   * @returns {undefined}
   */
  _configureRunId() {
    Object.defineProperty(
      this,
      'runId',
      {
        get() {
          return this._extractRunId(this._id);
        },
        set() {
          throw new Error('cannot set protected `runId`');
        },
      }
    );
    // cache & validate runId immediately
    this.runId; // eslint-disable-line
  }
}

/**
 * @private
 * @param {string} _id
 * @description extracts runId from a provided _id
 * @returns {string}
 */
ComputationResult.prototype._extractRunId = memoize(function _extractRunId(_id) {
  let runId;

  // enable abstract class testing by enabling loose _id runId extraction
  const runRegex = this._idRegex || /(^[^-]+)-?/;
  try {
    runId = _id.match(runRegex)[1];
  } catch (err) {
    /* istanbul ignore next */
    if (err instanceof TypeError) {
      throw new ReferenceError([
        'runId could not be extracted out of result id:',
        _id,
      ].join(' '));
    }
    /* istanbul ignore next */
    throw err;
  }
  return runId;
});

ComputationResult.schema = Object.assign({
  data: joi.any(),
  error: joi.object(),
  pipelineState: joi.object().keys({
    step: joi.number(),
    inProgress: joi.boolean(),
  }),
  pluginState: joi.object(),
  computationId: joi.string().required(),
  consortiumId: joi.string().required(),
}, PouchDocument.schema);

module.exports = ComputationResult;
