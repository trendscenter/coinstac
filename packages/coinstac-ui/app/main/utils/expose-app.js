'use strict';

const app = require('ampersand-app');

// client processes can tap into the main process' app
module.exports = function exposeAppConstant() {
  return app;
};
