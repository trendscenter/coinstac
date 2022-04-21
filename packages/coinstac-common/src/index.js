'use strict';

const Manager = require('coinstac-manager');
const validator = require('./services/validator');
const inputMapValidator = require('./services/validator/inputMapValidator');
const freesurferRegions = require('./freesurferRegions');


module.exports = {
  services: {
    Manager,
    validator,
  },
  inputMapValidator,
  freesurferRegions,
};
