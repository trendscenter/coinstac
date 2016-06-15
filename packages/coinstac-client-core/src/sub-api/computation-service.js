'use strict';

/**
 * @module computation-service
 */
const common = require('coinstac-common');
const Computation = common.models.computation.Computation;
const ModelService = require('../model-service');

/**
 * @extends ModelService
 */
class ComputationService extends ModelService {
  modelServiceHooks() {
    return {
      dbName: 'computations',
      ModelType: Computation,
    };
  }
}

module.exports = ComputationService;
