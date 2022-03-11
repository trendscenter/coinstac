const database = require('../index');

const description = '';

async function up() {
  const db = database.getDbInstance();

  // Upgrade code goes here
}

async function down() {
  const db = database.getDbInstance();

  // Downgrade code goes here
}

module.exports = {
  description,
  up,
  down
};
