'use strict';

const ComputationResult = require('./computation-result');
const joi = require('joi');

/* istanbul ignore next */
/**
 * @class RemoteComputationResult
 * @extends ComputationResult
 * @description RemoteComputationResult result container
 * @property {string[]} usernames
 * @property {string} _id extends it's parent `PouchDocument` `_id` requirement
 *                        and mandates the format: `runId`
 */
class RemoteComputationResult extends ComputationResult {
  constructor(opts) {
    super(opts);
    this._idRegex = RemoteComputationResult._idRegex;
  }
}

RemoteComputationResult._idRegex = /^([^-]+$)/; // format: runId
RemoteComputationResult.schema = Object.assign({}, ComputationResult.schema, {
  _id: joi.string().regex(RemoteComputationResult._idRegex).required(),
  complete: joi.boolean().default(false), // DecentralizedComputation complete/halted
  computationInputs: joi.array().items(joi.array()).required(),
  endDate: joi.date().timestamp(),
  startDate: joi.date().timestamp()
    .default(() => Date.now(), 'time of creation'),
  usernames: joi.array().items(joi.string()).default([]),
  userErrors: joi.array(),
  // runId - derived from _id, enforced on ComputationResult instantiation
});

module.exports = RemoteComputationResult;
