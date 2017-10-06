const rethink = require('rethinkdb');
const GraphQLJSON = require('graphql-type-json');

let connection = null;

rethink.connect({ host: 'localhost', port: 28015, db: 'coinstac' },
  (err, conn) => {
    if (err) throw err;
    connection = conn;
  });

/* eslint-disable */
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    fetchAllComputations: () => {
      return new Promise ((res, rej) => 
        rethink.table('computations').run(connection, (error, cursor) => {
          if (error) throw error;
          return cursor.toArray(function(err, result) {
            if (err) throw err;
            res(result);
          });
        })
      )
    },
    fetchComputationDetails: (_, args) => {
      return new Promise ((res, rej) =>
        rethink.table('computations').filter({ meta: { name: args.computationName } })
          .run(connection, (error, cursor) => {
            if (error) throw error;
            return cursor.toArray(function(err, result) {
              if (err) throw err;
              console.log(result);
              res(result[0]);
            });
          })
      )
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
    addComputation: (_, args) => {
      return new Promise ((res, rej) =>
        rethink.table('computations').insert(
          args.computationSchema,
          { 
            conflict: "replace",
            returnChanges: true,
          }
        )
          .run(connection, (error, result) => {
            res(result.changes[0].new_val);
          })
      )
    },
    removeAllComputations: () => {
      return new Promise ((res, rej) =>
        rethink.table('computations').delete()
          .run(connection, (error, result) => {
            res(result);
          })
      )
    },
    removeComputation: (_, args) => {
      return new Promise();
    },
    deleteConsortiumById: (_, args) => {
      return new Promise();
    },
    joinConsortium: (_, args) => {
      return new Promise();
    },
    setActiveComputation: (_, args) => {
      return new Promise();
    },
    setComputationInputs: (_, args) => {
      return new Promise();
    },
    leaveConsortium: (_, args) => {
      return new Promise();
    },
    saveConsortium: (_, args) => {
      return new Promise();
    },
  },
};

module.exports = resolvers;
