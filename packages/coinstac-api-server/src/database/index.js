const { MongoClient, ObjectID } = require('mongodb');
const testConfig = require('../../config/test');

let client = null;
let db = null;

const MONGO_CONN_STRING = process.env.NODE_ENV === 'test'
  ? testConfig.mongoConnString : process.env.MONGODB_CONN_STRING;
async function connect() {
  client = new MongoClient(MONGO_CONN_STRING, {
    useUnifiedTopology: true,
  });

  await client.connect();
}

function createDbInstance() {
  db = client.db(process.env.DATABASE_NAME);

  db.collection('users').createIndex({ username: 1 }, { unique: true });
  db.collection('users').createIndex({ email: 1 }, { unique: true });

  db.collection('headlessClients').createIndex({ name: 1 }, { unique: true });

  db.collection('datasets').createIndex({ '$**': 'text' });
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
