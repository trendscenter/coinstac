'use strict';

const app = require('ampersand-app');
const CoinstacClientCore = require('coinstac-client-core');
const merge = require('lodash/merge');
const parseCLIInput = require('app/main/utils/boot/parse-cli-input.js');

module.exports = function configureCore() {
  const coreConfiguration = merge(
    JSON.parse(app.config.toString()),
    parseCLIInput.get(),
    { logger: app.logger }
  );

  // `app.core.init` is fired from the UI
  app.core = new CoinstacClientCore(coreConfiguration);
};
