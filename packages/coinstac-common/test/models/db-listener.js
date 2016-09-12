'use strict';

const DBListener = require('../../src/models/db-listener');
const Pouchy = require('pouchy');
const tape = require('tape');
const PouchDBAdapterMemory = require('pouchdb-adapter-memory');

Pouchy.plugin(PouchDBAdapterMemory);

tape('DBListener :: destroy', t => {
  const pouchy = new Pouchy({
    name: 'testing',
  });
  const dbListener = new DBListener(pouchy);

  t.plan(1);

  dbListener.destroy()
    .then(() => {
      t.pass('DBListener completely destroyed');
    })
    .catch(t.end);
});
