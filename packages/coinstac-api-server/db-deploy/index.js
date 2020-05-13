const { MongoClient } = require('mongodb');
const { mongoAdmin } = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path
const config = require('../config/default');

let client = null;
let db = null;

function connect() {
  client = new MongoClient(`mongodb://${mongoAdmin.user}:${mongoAdmin.password}@${config.mongoHost}:${config.mongoPort}`, {
    useUnifiedTopology: true,
  });

  return client.connect();
}

function deployDb() {
  db = client.db(config.databaseName);

  db.collection('users').createIndex({ username: 1 }, { unique: true });
  db.collection('users').createIndex({ email: 1 }, { unique: true });
}

function getDbInstance() {
  if (!db) {
    db = client.db(config.databaseName);
  }

  return db;
}

function dropDbInstance() {
  client.db(config.databaseName).dropDatabase();
}

function close() {
  client.close();
}

module.exports = {
  connect,
  deployDb,
  getDbInstance,
  dropDbInstance,
  close,
};
