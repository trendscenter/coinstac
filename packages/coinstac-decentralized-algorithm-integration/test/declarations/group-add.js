'use strict';

const path = require('path');
const times = require('lodash/times');

module.exports = {
  /**
   * This property is used to pass computation input values from the
   * declaration into the computation.
   *
   * @todo Don't require `covariates` computation input
   *
   * {@link https://github.com/MRN-Code/coinstac/issues/161}
   */
  __ACTIVE_COMPUTATION_INPUTS__: [[[{
    name: 'Is Control',
    type: 'boolean',
  }]]],
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/group-add/index.js'
  ),
  local: times(4).map(() => ({
    metaFilePath: path.resolve(
      __dirname,
      '../../../coinstac-simulator/test/Test Data/metadata.csv'
    ),
    metaCovariateMapping: {
      1: 0,
    },
  })),
  verbose: true,
};
