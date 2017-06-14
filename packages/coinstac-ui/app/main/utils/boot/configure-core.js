'use strict';

const app = require('ampersand-app');
const common = require('coinstac-common');
const CoinstacClientCore = require('coinstac-client-core');
const { merge } = require('lodash');
const parseCLIInput = require('./parse-cli-input.js');
const PouchDBAdapterLevelDB = require('pouchdb-adapter-leveldb');
const PouchDBAdapterMemory = require('pouchdb-adapter-memory');
const url = require('url');

// TODO: Yeeikes
common.services.dbRegistry.DBRegistry.Pouchy.PouchDB.plugin(
  PouchDBAdapterLevelDB
);
common.services.dbRegistry.DBRegistry.Pouchy.PouchDB.plugin(
  PouchDBAdapterMemory
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
          getAdapter(name) {
            return name.includes('projects') ||
             name.includes('local-consortium') ? 'leveldb' : 'memory';
          },
        },
      },
    }
  );

  // `app.core.init` is fired from the UI
  app.core = new CoinstacClientCore(coreConfiguration);
};
