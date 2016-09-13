'use strict';

const path = require('path');

module.exports = {
  computationPath: path.join(__dirname, 'path', 'to', 'computation.js'),
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
