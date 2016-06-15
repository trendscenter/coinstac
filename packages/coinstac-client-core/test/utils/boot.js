'use strict';

const DBRegistry = require('coinstac-common').services.dbRegistry.DBRegistry;

DBRegistry.Pouchy.plugin(require('pouchdb-adapter-memory'));
