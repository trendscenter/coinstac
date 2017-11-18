const rethink = require('rethinkdb');
const Boom = require('boom');
const GraphQLJSON = require('graphql-type-json');
const Promise = require('bluebird');
const { PubSub, withFilter } = require('graphql-subscriptions');
const helperFunctions = require('../auth-helpers');
const initSubscriptions = require('./subscriptions');

/**
 * Helper function to retrieve all members of given table
 * @param {string} table - The table name
 * @return {array} The contents of the requested table
 */
function fetchAll(table) {
  return helperFunctions.getRethinkConnection()
    .then(connection =>
      rethink.table(table).run(connection)
    )
    .then(cursor => cursor.toArray())
    .then(result => result);
}

/**
 * Helper function to retrieve a single entry in a table
 * @param {string} table - The table name
 * @param {string} id - The entry id
 * @return {object} The requested table entry
 */
function fetchOne(table, id) {
  return helperFunctions.getRethinkConnection()
    .then(connection =>
      rethink.table(table).get(id).run(connection)
    )
    .then(result => result);
}

const pubsub = new PubSub();

initSubscriptions(pubsub);

/* eslint-disable */
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    /**
     * Returns all consortia.
     * @return {array} All consortia
     */
    fetchAllConsortia: () => fetchAll('consortia'),
    /**
     * Returns single consortium.
     * @param {object} args
     * @param {string} args.consortiumId Requested consortium ID
     * @return {object} Requested consortium if id present, null otherwise
     */
    fetchConsortium: (_, args) => args.consortiumId ? fetchOne('consortia', args.consortiumId) : null,
    /**
     * Returns all computations.
     * @return {array} All computations
     */
    fetchAllComputations: () => fetchAll('computations'),
    /**
     * Returns metadata for specific computation name
     * @param {object} args
     * @param {array} args.computationIds Requested computation ids
     * @return {array} List of computation objects
     */
    fetchComputation: (_, args) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').getAll(...args.computationIds)
            .run(connection)
        )
        .then((cursor) => cursor.toArray())
        .then((result) => {
          return result;
        });
    },
    /**
     * Returns all pipelines.
     * @return {array} List of all pipelines
     */
    fetchAllPipelines: () => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('pipelines')
            .map(pipeline =>
              pipeline.merge(pipeline =>
                ({
                  steps: pipeline('steps').map(step =>
                    step.merge({
                      computations: step('computations').map(compId =>
                        rethink.table('computations').get(compId)
                      )
                    })
                  )
                })
              )
            )
            .run(connection)
        )
        .then(cursor => cursor.toArray())
        .then(result => result);
    },
    /**
     * Returns single pipeline
     * @param {object} args
     * @param {string} args.pipelineId  Requested pipeline ID
     * @return {object} Requested pipeline if id present, null otherwise
     */
    fetchPipeline: (_, args) => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('pipelines')
            .get(args.pipelineId)
            // Populate computations subfield with computation meta information
            .merge(pipeline =>
              ({
                steps: pipeline('steps').map(step =>
                  step.merge({
                    computations: step('computations').map(compId =>
                      rethink.table('computations').get(compId)
                    )
                  })
                )
              })
            )
            .run(connection)
        )
        .then(result => result);
    },
    validateComputation: (_, args) => {
      return new Promise();
    },
  },
  Mutation: {
    /**
     * Add computation to RethinkDB
     * @param {object} args
     * @param {object} args.computationSchema Computation object to add/update
     * @return {object} New/updated computation object
     */
    addComputation: ({ auth: { credentials } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').insert(
            Object.assign({}, args.computationSchema, { submittedBy: credentials.id }),
            { 
              conflict: "replace",
              returnChanges: true,
            }
          )
          .run(connection)
        )
        .then((result) => {
          return result.changes[0].new_val;
        })
    },
    // TODO: add table variable to args
    /**
     * Add new user role to user perms, currently consortia perms only
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.doc Id of the document to add role to
     * @param {string} args.role Role to add to perms
     * @return {object} Updated user object
     */
    addUserRole: ({ auth: { credentials } }, args) => {
      // UserID arg could be used by admin to add/remove roles, ignored for now
      const { permissions } = credentials

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('users').get(credentials.id)('permissions').run(connection)
          .then((perms) => {
            let newRoles = [args.role];

            // Grab existing roles if present
            if (perms[args.table][args.doc] && perms[args.table][args.doc].indexOf(args.role) === -1) {
              newRoles = newRoles.concat(perms[args.table][args.doc]);
            } else if (perms[args.table][args.doc]) {
              newRoles = perms[args.table][args.doc];
            }

            return rethink.table('users').get(credentials.id).update(
              { permissions: { [args.table]: { [args.doc]: newRoles } } }, { returnChanges: true }
            ).run(connection);
          })
        )
        .then(result =>
          helperFunctions.getUserDetails({ username: credentials.id })
        )
        .then(result => result)
    },
    /**
     * Deletes consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to delete
     * @return {object} Deleted consortium
     */
    deleteConsortiumById: ({ auth: { credentials: { permissions } } }, args) => {
      if (!permissions.consortia.write
          && (!permissions.consortia[args.consortiumId]
              || !permissions.consortia[args.consortiumId].write
      )) {
            return Boom.forbidden('Action not permitted');
      }

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          new Promise.all([
            rethink.table('consortia').get(args.consortiumId)
              .delete({ returnChanges: true })
              .run(connection),
            rethink.table('users').replace(user =>
              user.without({ permissions: { consortia: args.consortiumId } })
            ).run(connection)
          ])
        )
        .then(([consortium]) => consortium.changes[0].old_val)
    },
    /**
     * Add user id to consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    joinConsortium: ({ auth: { credentials } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('consortia').get(args.consortiumId)
            .update(
              { "members": rethink.row("members").append(credentials.id)}, { returnChanges: true }
            ).run(connection)
        )
        .then(result => result.changes[0].new_val)
    },
    /**
     * Add user id to consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    leaveConsortium: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('consortia').get(args.consortiumId)
          .update(function(row){
            return{
              "members": row("members").setDifference([credentials.id]),
            }
          }, {returnChanges: true})
          .run(connection)
        )
        .then(result => result.changes[0].new_val)
    },
    /**
     * Deletes computation
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.computationId Computation id to delete
     * @return {object} Deleted computation
     */
    removeComputation: ({ auth: { credentials } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          new Promise.all([
            connection,
            rethink.table('computations').get(args.computationId).run(connection)
          ])
        )
        .then(([connection, comp]) => {
          if (comp.submittedBy !== credentials.id) {
            return Boom.forbidden('Action not permitted');
          }

          return rethink.table('computations').get(args.computationId)
            .delete({ returnChanges: true }).run(connection)
        })
        .then(result => result.changes[0].old_val)
    },
    /**
     * Add new user role to user perms, currently consortia perms only
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.doc Id of the document to add role to
     * @param {string} args.role Role to add to perms
     * @return {object} Updated user object
     */
    removeUserRole: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('users')
          .get(credentials.id).update({
            permissions: { [args.table]: {
              [args.doc]: rethink.table('users')
                .get(credentials.id)('permissions')(args.table)(args.doc)
                .filter(role => role.ne(args.role)),
            } },
          }, { nonAtomic: true }).run(connection)
        )
        .then(result =>
          helperFunctions.getUserDetails({ username: credentials.id })
        )
        .then(result => result)
    },
    /**
     * Sets active pipeline on consortia object
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium to update
     * @param {string} args.activePipeline Pipeline ID to mark as active
     */
    saveActivePipeline: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      /* TODO: Add permissions
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }*/
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('consortia').get(args.consortiumId).update({activePipeline: args.activePipeline})
          .run(connection)
        )
    },
    /**
     * Saves consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.consortium Consortium object to add/update
     * @return {object} New/updated consortium object
     */
    saveConsortium: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('consortia').insert(
            args.consortium,
            { 
              conflict: "update",
              returnChanges: true,
            }
          )
          .run(connection)
        )
        .then(result => result.changes[0].new_val)
    },
    /**
     * Saves pipeline
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.pipeline Pipeline object to add/update
     * @return {object} New/updated pipeline object
     */
    savePipeline: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      /* TODO: Add permissions
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }*/
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('pipelines').insert(
            args.pipeline,
            {
              conflict: "update",
              returnChanges: true,
            }
          )
          .run(connection)
          .then((result) => rethink.table('pipelines')
            .get(result.changes[0].new_val.id)
            // Populate computations subfield with computation meta information
            .merge(pipeline =>
              ({
                steps: pipeline('steps').map(step =>
                  step.merge({
                    computations: step('computations').map(compId =>
                      rethink.table('computations').get(compId)
                    )
                  })
                )
              })
            )
            .run(connection)
        ))
        .then(result => result)
    },
    setActiveComputation: (_, args) => {
      return new Promise();
    },
    setComputationInputs: (_, args) => {
      return new Promise();
    }
  },
  Subscription: {
    /**
     * Computation subscription
     * @param {object} payload
     * @param {string} payload.computationId The computation changed
     * @param {object} variables
     * @param {string} variables.computationId The computation listened for
     */
    computationChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('computationChanged'),
        (payload, variables) => (!variables.computationId || payload.computationId === variables.computationId)
      )
    },
    /**
     * Consortium subscription
     * @param {object} payload
     * @param {string} payload.consortiumId The consortium changed
     * @param {object} variables
     * @param {string} variables.consortiumId The consortium listened for
     */
    consortiumChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('consortiumChanged'),
        (payload, variables) => (!variables.consortiumId || payload.consortiumId === variables.consortiumId)
      )
    },
    /**
     * Pipeline subscription
     * @param {object} payload
     * @param {string} payload.pipelineId The pipeline changed
     * @param {object} variables
     * @param {string} variables.pipelineId The pipeline listened for
     */
    pipelineChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('pipelineChanged'),
        (payload, variables) => (!variables.pipelineId || payload.pipelineId === variables.pipelineId)
      )
    },
  },
};

module.exports = {
  resolvers,
  pubsub,
};
