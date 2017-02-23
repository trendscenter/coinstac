'use strict';

const path = require('path');

module.exports = {
  computationPath: './exec-computation.js',
  local: [{
    metaFilePath: path.join(__dirname, '../Test Data/metadata.csv'),
    metaCovariateMapping: {
      1: 0,
    },
  }],
  verbose: true,
};

