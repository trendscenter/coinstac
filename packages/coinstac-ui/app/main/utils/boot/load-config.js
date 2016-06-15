'use strict';

const app = require('ampersand-app');
const config = require('../../../config.js');

module.exports = function loadConfig() {
  return config()
  .then((convict) => {
    app.config = convict;
  });
};
