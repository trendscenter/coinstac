const rethink = require('rethinkdb');
const GraphQLJSON = require('graphql-type-json');

// let connection = null;

function getConnection() {
  return new Promise((res, rej) => {
    rethink.connect({
      host: 'localhost',
      port: 28015,
      db: 'coinstac',
      user: 'admin',
      password: 'admin',
    },
    (err, conn) => {
      if (err) {
        rej(err);
      }

      res(conn);
    });
  });
}

function isUserPermitted(tables, requestedTable, requestedPerms) {
  return tables.findIndex(
    ({ table, permissions }) => {
      let isPermitted;

      // Determine access to requested table
      if (table === requestedTable) {
        isPermitted = true;
      } else {
        return false;
      }

      // Determine permissions to requested table
      for (let p = 0; p < requestedPerms.length; p += 1) {
        if (permissions[requestedPerms[p]]) {
          isPermitted = true;
        } else {
          isPermitted = false;
          break;
        }
      }

      return isPermitted;
    }
  );
}

/*
rethink.connect({
  host: 'localhost',
  port: 28015,
  db: 'coinstac',
  user: 'admin',
  password: 'admin',
},
  (err, conn) => {
    if (err) throw err;
    connection = conn;
  });
*/

/* eslint-disable */
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    fetchAllComputations: ({ auth: { credentials } }, _) => {
      console.log('rootValue', credentials);
      if (isUserPermitted(credentials.tables, 'Computations', ['read']) === -1) {
        return { error: 'User not permitted'};
      }

      return getConnection()
        .then((connection) =>
          rethink.table('Computations').run(connection)
        )
        .then((cursor) => {
          return cursor.toArray(function(err, result) {
            if (err) throw err;
            return result;
          });
        })
        .catch(console.log)
    },
    fetchComputationMetadataByName: (_, args) => {
      return new Promise ((res, rej) =>
        rethink.table('Computations').filter({ meta: { name: args.computationName } })
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
        rethink.table('Computations').insert(
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
        rethink.table('Computations').delete()
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
