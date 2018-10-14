'use strict';

const { models: { User } } = require('coinstac-common');

const assign = require('lodash/assign');

module.exports = function userFactory(opts) {
  return assign(new User({
    username: 'testusername',
    email: 'testusername@email.com',
    password: 'testpassword',
    institution: 'testinstitution',
    name: 'testname',
  }, opts));
};
