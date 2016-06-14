'use strict';

const _ = require('lodash');
const pkg = require('./package.json');

const local = {
  fn: function (local, remote, cb) {
    cb(null, (local + remote) / 2);
  },

  type: 'function',
};

const remote = {
  fn: function (locals, remote, cb) {
    cb(null, _.reduce(locals, (sum, n) => sum + n));
  },

  type: 'function',
};

module.exports = {
  local: local,
  name: pkg.name,
  remote: remote,
  repository: {
    url: 'https://github.com/MRN-Code/' + pkg.name,
  },
  version: pkg.version,
};
