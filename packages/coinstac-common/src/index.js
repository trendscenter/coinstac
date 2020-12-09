'use strict';

const dockerManager = require('coinstac-manager');
const validator = require('./services/validator');


module.exports = {
  services: {
    dockerManager,
    validator,
  },
};
