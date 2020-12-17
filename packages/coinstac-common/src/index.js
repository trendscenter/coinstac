'use strict';

const Manager = require('coinstac-manager');
const validator = require('./services/validator');


module.exports = {
  services: {
    Manager,
    validator,
  },
};
