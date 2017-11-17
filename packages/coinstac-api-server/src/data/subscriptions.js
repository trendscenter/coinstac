const rethink = require('rethinkdb');
const helperFunctions = require('../auth-helpers');

const initSubscriptions = (pubsub) => {
  helperFunctions.getRethinkConnection()
  .then(connection =>
    rethink.table('consortia').changes().run(connection)
  )
  .then(feed =>
    feed.each((err, change) => {
      let val = {};

      if (!change.new_val) {
        val = Object.assign({}, change.old_val, { delete: true });
      } else {
        val = change.new_val;
      }

      pubsub.publish('consortiumChanged', {
        consortiumChanged: val,
        consortiumId: val.id,
      });
    })
  );

  helperFunctions.getRethinkConnection()
    .then(connection =>
      rethink.table('pipelines').changes().run(connection)
    )
    .then(feed =>
      feed.each((err, change) => {
        let val = {};

        if (!change.new_val) {
          val = Object.assign({}, change.old_val, { delete: true });
        } else {
          val = change.new_val;
        }

        pubsub.publish('pipelineChanged', {
          pipelineChanged: val,
          pipelineId: val.id,
        });
      })
    );
};

module.exports = initSubscriptions;
