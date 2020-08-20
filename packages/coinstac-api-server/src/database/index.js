const { MongoClient, ObjectID } = require('mongodb');

let client = null;
let db = null;

async function connect() {
  client = new MongoClient(process.env.MONGODB_CONN_STRING, {
    useUnifiedTopology: true,
  });

  await client.connect();
}

function createDbInstance() {
  db = client.db(process.env.DATABASE_NAME);

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

function close() {
  client.close();
}

module.exports = {
  connect,
  close,
  dropDbInstance,
  getDbInstance,
  createUniqueId,
};
