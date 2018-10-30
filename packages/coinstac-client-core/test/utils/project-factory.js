'use strict';

const { models: { Project } } = require('coinstac-common');

module.exports = function userFactory(opts) {
  return Object.assign(new Project({
    name: 'test-project',
  }, opts));
};
