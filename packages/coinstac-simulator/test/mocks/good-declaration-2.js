'use strict';

module.exports = {
  computationPath: './path/to/computation.js',
  local: [{
    x: Promise.resolve('how'),
    y: 'who',
  }],
  remote: {
    x: Promise.resolve('where'),
    y: 'why',
  },
  verbose: true,
};
