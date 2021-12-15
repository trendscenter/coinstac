const { MongoClient, ObjectID } = require('mongodb');

let client = null;
let db = null;

const MONGO_CONN_STRING = process.env.MONGODB_CONN_STRING;
async function connect() {
  client = new MongoClient(MONGO_CONN_STRING, {
    useUnifiedTopology: true,
  });

  await client.connect();
}

function createDbInstance() {
  db = client.db(process.env.DATABASE_NAME);
}

async function createDbIndexes() {
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('headlessClients').createIndex({ name: 1 }, { unique: true });
  await db.collection('datasets').createIndex({ '$**': 'text' });
}

async function dropDbInstance() {
  if (!db) {
    createDbInstance();
  }

  await db.dropDatabase();
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
  createDbIndexes,
};
