'use strict';

const CoinstacClientCore = require('coinstac-client-core');
const { merge } = require('lodash');
const parseCLIInput = require('./parse-cli-input.js');

module.exports = function configureCore(config, logger, userId) {
  const coreConfiguration = merge(
    JSON.parse(config.toString()),
    parseCLIInput.get(),
    {
      logger,
      userId,
    }
  );

  return new CoinstacClientCore(coreConfiguration);
};
