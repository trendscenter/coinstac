'use strict';

const _ = require('lodash');
const pkg = require('./package.json');

const local = {
  fn(local, remote) {
    return (local + remote) / 2;
  },

  type: 'function',
};

const remote = {
  fn(locals) {
    return _.reduce(locals, (sum, n) => sum + n);
  },

  type: 'function',
};

module.exports = {
  local,
  name: pkg.name,
  remote,
  repository: {
    url: `https://github.com/MRN-Code/${pkg.name}`,
  },
  version: pkg.version,
};
