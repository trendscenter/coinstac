const rethink = require('rethinkdb');
const singleShot = require('./data/single-shot-schema');
const multiShot = require('./data/multi-shot-schema');
const helperFunctions = require('../src/auth-helpers');

helperFunctions.getRethinkConnection()
.then((connection) => {
  return rethink.dbList().contains('coinstac')
  .do((exists) => {
    return rethink.branch(
      exists,
      rethink.dbDrop('coinstac'),
      { dbs_dropped: 0 }
    );
  }).run(connection)
  .then(() => rethink.dbCreate('coinstac').run(connection))
  .then(() => rethink.tableCreate('roles', { primaryKey: 'role' }).run(connection))
  .then(() => rethink.table('roles').insert([
    { role: 'owner', verbs: { write: true, read: true } },
    { role: 'member', verbs: { subscribe: true } },
  ]).run(connection))
  .then(() => rethink.tableCreate('computations').run(connection))
  .then(() => rethink.table('computations').insert([singleShot, multiShot]).run(connection))
  .then(() => rethink.tableCreate('users').run(connection))
  .then(() => rethink.tableCreate('consortia').run(connection))
  .then(() => rethink.table('consortia').insert({
    id: 'test-cons-1',
    name: 'Test Consortia 1',
    description: 'This consortia is for testing.',
    owners: ['author'],
    members: ['test'],
  }).run(connection))
  .then(() => rethink.table('consortia').insert({
    id: 'test-cons-2',
    name: 'Test Consortia 2',
    description: 'This consortia is for testing too.',
    owners: ['test'],
    members: ['author'],
  }).run(connection))
  .then(() => connection.close());
})
.then(() => helperFunctions.hashPassword('password'))
.then(passwordHash =>
  helperFunctions.createUser({
    username: 'test',
    institution: 'mrn',
    email: 'test@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        'test-cons-1': ['member'],
        'test-cons-2': ['owner'],
      },
    },
  }, passwordHash)
)
.then(() => helperFunctions.hashPassword('password'))
.then(passwordHash =>
  helperFunctions.createUser({
    username: 'server',
    institution: 'mrn',
    email: 'server@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
    },
  }, passwordHash)
)
.then(() => helperFunctions.hashPassword('password'))
.then(passwordHash =>
  helperFunctions.createUser({
    username: 'author',
    institution: 'mrn',
    email: 'server@mrn.org',
    permissions: {
      computations: {
        'single-shot-test-id': ['owner'],
        'multi-shot-test-id': ['owner'],
      },
      consortia: {
        'test-cons-1': ['owner'],
        'test-cons-2': ['member'],
      },
    },
  }, passwordHash)
)
.then(() => {
  process.exit();
})
.catch(console.log);  // eslint-disable-line no-console
