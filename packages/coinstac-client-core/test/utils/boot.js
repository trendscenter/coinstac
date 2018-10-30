'use strict';

const { services: { dbRegistry: { DBRegistry } } } = require('coinstac-common');

DBRegistry.Pouchy.plugin(require('pouchdb-adapter-memory'));
