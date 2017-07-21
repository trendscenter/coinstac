const rethink = require('rethinkdb');

let connection = null;

rethink.connect({ host: 'localhost', port: 28015 },
  (err, conn) => {
    if (err) throw err;
    connection = conn;
  }
);

/* eslint-disable */
const resolvers = {
  Query: {
    fetchAllComputations: () => {
      return new Promise(
        
      );
    },
    fetchComputationById: (_, args) => {
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
