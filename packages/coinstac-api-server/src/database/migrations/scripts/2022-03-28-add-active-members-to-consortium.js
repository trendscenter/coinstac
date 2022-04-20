/* eslint-disable */
const database = require('../../index');

const description = 'Add active members property to consortia';

async function up() {
  const db = database.getDbInstance();

  db.collection('consortia').updateMany({}, [
    { $set: { activeMembers: '$members' } }
  ]);
}

async function down() {
  const db = database.getDbInstance();

  db.collection('runs').updateMany({}, [
    { $unset: { activeMembers: '' } }
  ]);
}

module.exports = {
  description,
  up,
  down,
};
