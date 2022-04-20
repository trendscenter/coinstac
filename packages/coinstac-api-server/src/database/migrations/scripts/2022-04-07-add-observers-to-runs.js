/* eslint-disable */
const database = require('../../index');

const description = 'Add observers property to runs, so these users can receive status update for runs';

async function up() {
  const db = database.getDbInstance();

  db.collection('runs').updateMany({}, [
    { $set: { observers: '$clients' } }
  ]);
}

async function down() {
  const db = database.getDbInstance();

  db.collection('runs').updateMany({}, [
    { $unset: { observers: '' } }
  ]);
}

module.exports = {
  description,
  up,
  down,
};
