'use strict';

const CoinstacClientCore = require('coinstac-client-core');
const { merge } = require('lodash');
const parseCLIInput = require('./parse-cli-input');

module.exports = function configureCore(
  config, logger, userId, appDirectory, imageDirectory, clientServerURL, token
) {
  const coreConfiguration = merge(
    JSON.parse(config.toString()),
    parseCLIInput.get(),
    {
      logger,
      userId,
      appDirectory,
      imageDirectory,
      clientServerURL,
      token,
    }
  );

  const core = new CoinstacClientCore(coreConfiguration);
  return core.initialize().then(() => core);
};
