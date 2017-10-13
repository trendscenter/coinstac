const rethink = require('rethinkdb');
const singleShot = require('./data/Single-Shot Schema');
const multiShot = require('./data/Multi-Shot Schema');
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
  .then(() => rethink.tableCreate('pipelines').run(connection))
  .then(() => rethink.tableCreate('computations').run(connection))
  .then(() => rethink.table('computations').insert([singleShot, multiShot], { returnChanges: true }).run(connection))
  .then(compInsertResult => rethink.table('pipelines').insert({
    name: 'Test Pipeline',
    description: 'Test description',
    steps: [
      {
        computations: [
          compInsertResult.changes[0].new_val.id,
        ],
        controller: {
          options: { type: 'single' },
          id: 'test-id',
        },
        id: 'HJwMOMTh-',
        ioMap: {
          covariates: [
            {
              name: 'isControl',
              source: { inputKey: 'file', inputLabel: 'File', pipelineIndex: -1 },
              type: 'boolean',
            },
            {
              name: 'age',
              source: { inputKey: 'file', inputLabel: 'File', pipelineIndex: -1 },
              type: 'number',
            },
          ],
          freeSurferRegion: ['3rd-Ventricle'],
          lambda: '4',
        },
      },
      {
        computations: [
          compInsertResult.changes[1].new_val.id,
        ],
        controller: {
          options: { type: 'single' },
          id: 'test-id',
        },
        id: 'HyLfdfanb',
        ioMap: {
          covariates: [
            {
              name: 'biased xs',
              source: { inputKey: 'biasedX', inputLabel: 'Computation 1: Biased Xs', pipelineIndex: 0 },
              type: 'number',
            },
          ],
          freeSurferRegion: ['5th-Ventricle'],
          iterationCount: '3',
          lambda: '4',
        },
      },
    ],
  }).run(connection))
  .then(() => rethink.tableCreate('users').run(connection))
  .then(() => rethink.tableCreate('consortia').run(connection))
  .then(() => rethink.table('consortia').insert({
    id: 'test-cons-1',
    name: 'Test Consortia 1',
    description: 'This consortia is for testing.',
    owners: ['author'],
    users: ['author'],
  }).run(connection))
  .then(() => rethink.table('consortia').insert({
    id: 'test-cons-2',
    name: 'Test Consortia 2',
    description: 'This consortia is for testing too.',
    owners: ['test'],
    users: ['test'],
  }).run(connection))
  .then(() => connection.close());
})
.then(() => {
  let passwordHash = helperFunctions.hashPassword('password');
  return helperFunctions.createUser({
    username: 'test',
    institution: 'mrn',
    email: 'test@mrn.org',
    permissions: {
      computations: {
        read: true,
      },
      consortia: {
        read: true,
        'test-cons-2': {
          write: true,
        },
      },
      pipelines: { read: true },
    },
  }, passwordHash)
  .then(() => {
    passwordHash = helperFunctions.hashPassword('password');
    return helperFunctions.createUser({ username: 'server', institution: 'mrn', email: 'server@mrn.org' }, passwordHash);
  })
  .then(() => {
    passwordHash = helperFunctions.hashPassword('password');
    return helperFunctions.createUser({
      username: 'author',
      institution: 'mrn',
      email: 'server@mrn.org',
      permissions: {
        computations: {
          read: true,
          write: true,
        },
        consortia: {
          read: true,
          'test-cons-1': {
            write: true,
          },
        },
        pipelines: { read: true },
      },
    }, passwordHash);
  })
  .then(() => {
    process.exit();
  });
})
.catch(console.log);  // eslint-disable-line no-console
