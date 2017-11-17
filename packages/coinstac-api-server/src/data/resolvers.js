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
     * @param {string} args.id
     * @return {object} Requested consortium if id present, null otherwise
     */
    fetchConsortium: (_, args) => args.consortiumId ? fetchOne('consortia', args.consortiumId) : null,
    /**
     * Returns all computations. Checks user permissions retrieved from JWT middleware validateFunc.
     */
    fetchAllComputations: () => fetchAll('computations'),
    /**
     * Returns metadata for specific computation name
     */
    fetchComputation: ({ auth: { credentials: { permissions } } }, args) => {
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
     * Returns all pipelines. Checks user permissions retrieved from JWT middleware validateFunc.
     */
    fetchAllPipelines: ({ auth: { credentials: { permissions } } }, _) => {
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
    fetchPipeline: ({ auth }, args) => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('pipelines')
            .get('test-pipeline')
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
     */
    addComputation: ({ auth: { credentials: { permissions } } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').insert(
            args.computationSchema,
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
    /**
     * Saves consortia
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
    removeComputation: (_, args) => {
      return new Promise();
    },
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
            .delete({returnChanges: true})
            .run(connection),
            rethink.table('users').replace(user =>
              user.without({ permissions: { consortia: args.consortiumId } })
            ).run(connection)
          ])
        )
        .then(result => result[0].changes[0].old_val)
    },
    joinConsortium: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('consortia').get(args.consortiumId)
            .update(
              { "members": rethink.row("members").append(credentials.id)}, { returnChanges: true }
            ).run(connection)
        )
        .then(result => result.changes[0].new_val)
    },
    setActiveComputation: (_, args) => {
      return new Promise();
    },
    setComputationInputs: (_, args) => {
      return new Promise();
    },
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
    addUserRole: ({ auth: { credentials } }, args) => {
      // UserID arg could be used by admin to add/remove roles, ignored for now
      const { permissions } = credentials

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('users').get(credentials.id)('permissions').run(connection)
          .then((perms) => {
            let newRoles = [args.role];

            // Grab existing roles if present
            if (perms.consortia[args.doc] && perms.consortia[args.doc].indexOf(args.role) === -1) {
              newRoles = newRoles.concat(perms.consortia[args.doc]);
            } else if (perms.consortia[args.doc]) {
              newRoles = perms.consortia[args.doc];
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
    }
  },
  Subscription: {
    computationChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('computationChanged'),
        (payload, variables) => (!variables.computationId || payload.computationId === variables.computationId)
      )
    },
    consortiumChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('consortiumChanged'),
        (payload, variables) => (!variables.consortiumId || payload.consortiumId === variables.consortiumId)
      )
    },
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
