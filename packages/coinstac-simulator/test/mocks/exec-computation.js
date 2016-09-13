'use strict';

module.exports = {
  local: {
    args: ['./exec-script.js', '--local'],
    cmd: 'node',
    type: 'cmd',
    verbose: true,
  },
  name: 'test',
  remote: {
    args: ['./exec-script.js', '--remote'],
    cmd: 'node',
    type: 'cmd',
    verbose: true,
  },
  version: '1.0.0',
};

