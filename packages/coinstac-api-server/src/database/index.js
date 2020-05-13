const { MongoClient } = require('mongodb');
const { mongoUser } = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path
const config = require('../../config/default');

let client = null;
let db = null;

function connect() {
  client = new MongoClient(`mongodb://${mongoUser.user}:${mongoUser.password}@${config.mongoHost}:${config.mongoPort}`, {
    useUnifiedTopology: true,
  });

  return client.connect();
}

function getDbInstance() {
  if (!db) {
    db = client.db(config.databaseName);
  }

  return db;
}

module.exports = {
  connect,
  getDbInstance,
};
