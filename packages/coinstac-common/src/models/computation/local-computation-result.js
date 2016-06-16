const ComputationResult = require('./computation-result');
const joi = require('joi');

/* istanbul ignore next */
/**
 * @class LocalComputationResult
 * @extends ComputationResult
 * @description LocalComputationResult result container
 * @property {string} username
 * @property {string} _id extends it's parent `PouchDocument` `_id` requirement
 *                        and mandates the format: `runId-userId`
 */
class LocalComputationResult extends ComputationResult {
  constructor(opts) {
    super(opts);
    this._idRegex = LocalComputationResult._idRegex;
  }
}

LocalComputationResult._idRegex = /(^[^-]+)-[^-]+$/; // format: runId-userId
LocalComputationResult.schema = Object.assign({}, ComputationResult.schema, {
  _id: joi.string().regex(LocalComputationResult._idRegex).required(),
  username: joi.string().required(),
  userData: joi.any(),
});

module.exports = LocalComputationResult;
