/* eslint-disable */
const migrate = require('migrate');
const path = require('path');

const database = require('../index');

const stateStore = {
  load: async function(cb) {
    try {
      const db = database.getDbInstance();
  
      const migrationsState = await db.collection('migrations').findOne();

      if (!migrationsState) {
        // Never ran a migration on this db
        return cb(null, {});
      }

      cb(null, migrationsState);
    } catch (error) {
      cb(error);
    }
  },
  save: async function(set, cb) {
    try {
      const db = database.getDbInstance();

      await db.collection('migrations').updateOne(
        {},
        {
          $set: {
            lastRun: set.lastRun
          },
          $push: {
            migrations: { $each: set.migrations }
          }
        },
        { upsert: true }
      );

      cb(null, null);
    } catch (error) {
      cb(error);
    }
  }
};

async function runUpgradeMigrations() {
  console.log('Starting database migration');

  try {
    console.log('Connecting to database...');
    await database.connect();
  
    const migrateOptions = {
      stateStore,
      migrationsDirectory: path.join(__dirname, 'scripts')
    };
  
    const migrationSet = await new Promise((resolve, reject) => {
      migrate.load(migrateOptions, async (err, set) => {
        if (err) return reject(err);
        resolve(set);
      });
    });

    if (migrationSet.lastRun) {
      console.log(`Last run script was ${migrationSet.lastRun}. Only the scripts after that will be run.`);
    }

    await new Promise((resolve, reject) => {
      migrationSet.up((err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    console.log('Database was successfully migrated');
  } catch (error) {
    console.error('The following error occurred while migration the database', error);
  } finally {
    await database.close();
  }
}

runUpgradeMigrations();
