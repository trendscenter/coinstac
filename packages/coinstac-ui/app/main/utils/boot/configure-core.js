'use strict';

const app = require('ampersand-app');
const common = require('coinstac-common');
const CoinstacClientCore = require('coinstac-client-core');
const merge = require('lodash/merge');
const parseCLIInput = require('app/main/utils/boot/parse-cli-input.js');
const PouchDBAdapterLevelDB = require('pouchdb-adapter-leveldb');
const url = require('url');

// TODO: Yeeikes
common.services.dbRegistry.DBRegistry.Pouchy.PouchDB.plugin(
  PouchDBAdapterLevelDB
);

module.exports = function configureCore() {
  const coreConfiguration = merge(
    JSON.parse(app.config.toString()),
    parseCLIInput.get(),
    {
      hp: url.format(app.config.get('api')),
      logger: app.logger,
      db: {
        pouchConfig: {
          adapter: 'leveldb',
        },
      },
    }
  );

  // `app.core.init` is fired from the UI
  app.core = new CoinstacClientCore(coreConfiguration);
};
