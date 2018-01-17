const rethink = require('rethinkdb');
const Boom = require('boom');
const GraphQLJSON = require('graphql-type-json');
const helperFunctions = require('../auth-helpers');
const Promise = require('bluebird');

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
              || (args.consortiumId
                  && !permissions.consortia[args.consortiumId].write)
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
};

module.exports = resolvers;
