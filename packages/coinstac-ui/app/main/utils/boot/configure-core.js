'use strict';

const CoinstacClientCore = require('coinstac-client-core');
const { merge } = require('lodash');
const parseCLIInput = require('./parse-cli-input.js');
const url = require('url');

module.exports = function configureCore(config, logger, userId) {
  const coreConfiguration = merge(
    JSON.parse(config.toString()),
    parseCLIInput.get(),
    {
      hp: url.format(config.get('api')),
      logger,
      db: {},
      userId,
    }
  );

  return new CoinstacClientCore(coreConfiguration);
};
