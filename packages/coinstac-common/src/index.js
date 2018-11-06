'use strict';

const dockerManager = require('coinstac-docker-manager');
const validator = require('./services/validator');


module.exports = {
  services: {
    dockerManager,
    validator,
  },
};
