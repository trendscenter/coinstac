'use strict';

module.exports = {
  computationPath: './path/to/computation.js',
  local: [{
    x: 1,
    y: 2,
  }],
  remote: {
    x: Promise.resolve('charizard'),
    y: Promise.reject('pikachu'),
  },
};

