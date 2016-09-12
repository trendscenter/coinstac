'use strict';

module.exports = {
  computationPath: './path/to/computation.js',
  local: [{
    x: Promise.resolve('hi'),
    y: Promise.reject('bye'),
  }],
};

