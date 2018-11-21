const rethink = require('rethinkdb');
const helperFunctions = require('../../auth-helpers');
const pipelineChangedSubsPreprocess = require('./pipelineChanged');
const userMetadataChangedSubsPreprocess = require('./userMetadataChanged');

// Add new tables here to create a new changefeed on server start
const tables = [
  { tableName: 'computations', idVar: 'computationId', subVar: 'computationChanged' },
  { tableName: 'consortia', idVar: 'consortiumId', subVar: 'consortiumChanged' },
  { tableName: 'pipelines', idVar: 'pipelineId', subVar: 'pipelineChanged', preprocess: pipelineChangedSubsPreprocess },
  { tableName: 'users', idVar: 'userId', subVar: 'userChanged' },
  { tableName: 'users', idVar: 'userId', subVar: 'userMetadataChanged', preprocess: userMetadataChangedSubsPreprocess },
  { tableName: 'runs', idVar: 'runId', subVar: 'userRunChanged' },
];

/**
 * Initialize RethinkDB changefeeds to detect table changes and fire off GraphQL subscription topics
 * @param {object} pubsub GraphQL publish and subscribe object
 */
const initSubscriptions = (pubsub) => {
  tables.forEach((table) => {
    helperFunctions.getRethinkConnection()
      .then(connection => rethink.table(table.tableName).changes().run(connection))
      .then(feed => feed.each((err, change) => {
        let val = {};

        if (!change.new_val) {
          val = Object.assign({}, change.old_val, { delete: true });
        } else {
          val = change.new_val;
        }

        const preprocessPromise = table.preprocess ? table.preprocess(val) : Promise.resolve(val);

        preprocessPromise
          .then(result => 
            pubsub.publish(table.subVar, {
              [table.subVar]: result,
              [table.idVar]: result.id,
            })
          )
      }))
  });
};

module.exports = initSubscriptions;
