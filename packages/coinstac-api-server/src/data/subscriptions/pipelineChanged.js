const helperFunctions = require('../../auth-helpers');

function preprocessPipelineChangedSubs(pipeline) {
  pipeline.steps = [];

  if (pipeline.delete) {
    return Promise.resolve(pipeline);
  }
  
  return helperFunctions.getRethinkConnection()
    .then(connection => rethink.table('pipelines')
      .get(pipeline.id)
      // Populate computations subfield with computation meta information
      .merge(pipeline => ({
        steps: pipeline('steps').map(step => step.merge({
          computations: step('computations').map(compId => rethink.table('computations').get(compId)),
        })),
      }))
      .run(connection)
    );
}

module.exports = preprocessPipelineChangedSubs;