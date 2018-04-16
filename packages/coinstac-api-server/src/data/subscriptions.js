const rethink = require('rethinkdb');
const helperFunctions = require('../auth-helpers');

// Add new tables here to create a new changefeed on server start
const tables = [
  { tableName: 'computations', idVar: 'computationId', subVar: 'computationChanged' },
  { tableName: 'consortia', idVar: 'consortiumId', subVar: 'consortiumChanged' },
  { tableName: 'pipelines', idVar: 'pipelineId', subVar: 'pipelineChanged' },
  { tableName: 'users', idVar: 'userId', subVar: 'userChanged' },
  { tableName: 'runs', idVar: 'runId', subVar: 'userRunChanged' },
];

/**
 * Initialize RethinkDB changefeeds to detect table changes and fire off GraphQL subscription topics
 * @param {object} pubsub GraphQL publish and subscribe object
 */
const initSubscriptions = (pubsub) => {
  tables.forEach((table) => {
    helperFunctions.getRethinkConnection()
    .then(connection =>
      rethink.table(table.tableName).changes().run(connection)
    )
    .then(feed =>
      feed.each((err, change) => {
        let val = {};

        if (!change.new_val) {
          val = Object.assign({}, change.old_val, { delete: true });
          if (table.tableName === 'pipelines') val.steps = [];
        } else {
          val = change.new_val;
        }

        if (table.tableName === 'pipelines' && !val.delete) {
          return helperFunctions.getRethinkConnection()
          .then(connection =>
            rethink.table('pipelines')
              .get(val.id)
              // Populate computations subfield with computation meta information
              .merge(pipeline =>
                ({
                  steps: pipeline('steps').map(step =>
                    step.merge({
                      computations: step('computations').map(compId =>
                        rethink.table('computations').get(compId)
                      ),
                    })
                  ),
                })
              )
              .run(connection)
          )
          .then((result) => {
            pubsub.publish(table.subVar, {
              [table.subVar]: result,
              [table.idVar]: result.id,
            });
          });
        }

        pubsub.publish(table.subVar, {
          [table.subVar]: val,
          [table.idVar]: val.id,
        });
      })
    );
  });
};

module.exports = initSubscriptions;
