const { MongoClient, ObjectID } = require('mongodb');
const defaultConfig = require('../../config/default');
const testConfig = require('../../config/test');

let client = null;
let db = null;

const config = process.env.NODE_ENV === 'test' ? testConfig : defaultConfig;

async function connect() {
  client = new MongoClient(config.mongoConnString, {
    useUnifiedTopology: true,
  });

  await client.connect();
}

function createDbInstance() {
  db = client.db(config.databaseName);

  db.collection('users').createIndex({ username: 1 }, { unique: true });
  db.collection('users').createIndex({ email: 1 }, { unique: true });
}

function dropDbInstance() {
  if (!db) {
    createDbInstance();
  }

  db.dropDatabase();
  db = null;
}

function getDbInstance() {
  if (!db) {
    createDbInstance();
  }

  return db;
}

function createUniqueId() {
  return new ObjectID();
}

async function close() {
  await client.close();
}

module.exports = {
  connect,
  close,
  dropDbInstance,
  getDbInstance,
  createUniqueId,
};
