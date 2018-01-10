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
  .then(() => rethink.tableCreate('computations').run(connection))
  .then(() => rethink.table('computations').insert([singleShot, multiShot]).run(connection))
  // .then(() => rethink.db('rethinkdb').table('users').insert({ id: 'server', password: 'password' }).run(connection))
  // .then(() => rethink.db('coinstac').grant('server', { read: true }).run(connection))
  .then(() => rethink.db('coinstac').tableCreate('users').run(connection))
  .then(() => connection.close());
})
.then(() => {
  helperFunctions.hashPassword('password')
    .then(passwordHash => helperFunctions.createUser({ username: 'test', institution: 'mrn', email: 'test@mrn.org' }, passwordHash))
    .then(() => helperFunctions.hashPassword('password'))
    .then(passwordHash => helperFunctions.createUser({ username: 'server', institution: 'mrn', email: 'server@mrn.org' }, passwordHash))
    .then(() => helperFunctions.hashPassword('password'))
    .then(passwordHash =>
      helperFunctions.createUser({
        username: 'author',
        institution: 'mrn',
        email: 'server@mrn.org',
        permissions: {
          computations: {
            read: true,
            write: true,
          },
        },
      }, passwordHash))
    .then(() => {
      process.exit();
    });
})
.catch(console.log);
