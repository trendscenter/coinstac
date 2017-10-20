const rethink = require('rethinkdb');
const Boom = require('boom');
const GraphQLJSON = require('graphql-type-json');
const helperFunctions = require('../auth-helpers');

/* eslint-disable */
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    /**
     * Returns all consortia. Checks user permissions retrieved from JWT middleware validateFunc.
     */
    fetchAllConsortia: ({ auth: { credentials: { permissions } } }, _) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('consortia').run(connection)
        )
        .then((cursor) => cursor.toArray())
        .then((result) => result);
    },
    /**
     * Returns all computations. Checks user permissions retrieved from JWT middleware validateFunc.
     */
    fetchAllComputations: ({ auth: { credentials: { permissions } } }, _) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').run(connection)
        )
        .then((cursor) => cursor.toArray())
        .then((result) => result);
    },
    /**
     * Returns metadata for specific computation name
     */
    fetchComputationDetails: ({ auth: { credentials: { permissions } } }, args) => {
      if (!args.computationIds) return;

      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').getAll(...args.computationIds)
            .run(connection)
        )
        .then((cursor) => cursor.toArray())
        .then((result) => {
          console.log(result);
          return result;
        });
    },
    validateComputation: (_, args) => {
      return new Promise();
    },
    fetchConsortiumById: (_, args) => {
      return new Promise();
    },
    fetchRunForConsortium: (_, args) => {
      return new Promise();
    },
    fetchRunForUser: (_, args) => {
      return new Promise();
    },
    fetchRunById: () => {
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
     * Remove all computations from DB
     */
    removeAllComputations: ({ auth: { credentials: { permissions } } }, _) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').delete()
            .run(connection)
        )
        .then((result) => result);
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
        .then((connection) =>
          rethink.table('consortia').insert(
            args.consortium,
            { 
              conflict: "update",
              returnChanges: true,
            }
          )
          .run(connection)
          .then((result) =>
            helperFunctions.addRoleToUser(
              permissions,
              credentials.id,
              'consortia',
              result.changes[0].new_val.id,
              'owner',
              connection
            ).then(perms => (
              { consortium: result.changes[0].new_val, userPerms: perms }
            ))
          )
        )
    },
    removeComputation: (_, args) => {
      return new Promise();
    },
    deleteConsortiumById: ({ auth: { credentials: { permissions } } }, args) => {
      if (!permissions.consortia.write
          && (!permissions.consortia[args.consortiumId]
              || (args.consortiumId
                  && !permissions.consortia[args.consortiumId].write)
      )) {
            return Boom.forbidden('Action not permitted');
      }

      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('consortia').get(args.consortiumId)
          .delete({returnChanges: true})
          .run(connection)
        )
        .then((result) => {
          return result.changes[0].old_val;
        })
    },
    joinConsortium: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          helperFunctions.addRoleToUser(
            permissions,
            credentials.id,
            'consortia',
            args.consortiumId,
            'member',
            connection
          )
          .then((perms) => rethink.table('consortia').get(args.consortiumId)
            .update(
              { "members": rethink.row("members").append(credentials.id)}, { returnChanges: true }
            ).run(connection)
            .then((result) => {
              return { consortium: result.changes[0].new_val, userPerms: perms };
            })
          )
        )
        
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
        .then((result) => {
          return result.changes[0].new_val;
        })
    },
  },
};

module.exports = resolvers;
