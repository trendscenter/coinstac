'use strict';

const CoinstacClientCore = require('coinstac-client-core');
const { merge } = require('lodash');
const parseCLIInput = require('./parse-cli-input.js');

module.exports = function configureCore(config, logger) {
  const coreConfiguration = merge(
    JSON.parse(config.toString()),
    parseCLIInput.get(),
    {
      logger,
      db: {},
    }
  );

  return new CoinstacClientCore(coreConfiguration);
};
