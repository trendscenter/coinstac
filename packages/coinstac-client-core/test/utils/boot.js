'use strict';

const DBRegistry = require('coinstac-common/src/services/classes/db-registry');

DBRegistry.Pouchy.plugin(require('pouchdb-adapter-memory'));
