const ComputationResult = require('./computation-result');
const joi = require('joi');
const util = require('util');

/* istanbul ignore next */
/**
 * @class RemoteComputationResult
 * @extends ComputationResult
 * @description RemoteComputationResult result container
 * @property {string[]} usernames
 * @property {string} _id extends it's parent `PouchDocument` `_id` requirement
 *                        and mandates the format: `runId`
 */
function RemoteComputationResult() {
  this._idRegex = RemoteComputationResult._idRegex;
  ComputationResult.apply(this, arguments);
}
util.inherits(RemoteComputationResult, ComputationResult);

RemoteComputationResult._idRegex = /^([^-]+$)/; // format: runId
RemoteComputationResult.schema = Object.assign({}, ComputationResult.schema, {
  _id: joi.string().regex(RemoteComputationResult._idRegex).required(),
  usernames: joi.array().items(joi.string()).default([]),
  complete: joi.boolean().default(false), // DecentralizedComputation fully complete
    // runId - derived from _id, enforced on ComputationResult instantiation
});

module.exports = RemoteComputationResult;
