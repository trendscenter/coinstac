'use strict';

const common = require('coinstac-common');
const Project = common.models.Project;

module.exports = function userFactory(opts) {
  return Object.assign(new Project({
    name: 'test-project',
  }, opts));
};
