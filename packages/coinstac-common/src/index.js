'use strict';

const Manager = require('coinstac-container-manager');
const validator = require('./services/validator');


module.exports = {
  services: {
    Manager,
    validator,
  },
};
