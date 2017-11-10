const schema = require('./data/schema');
const jwt2 = require('hapi-auth-jwt2');
const { graphiqlHapi, graphqlHapi } = require('apollo-server-hapi');

module.exports = [
  {
    register: jwt2,
    options: {},
  },
  {
    register: graphiqlHapi,
    options: {
      path: '/graphiql',
      graphiqlOptions: {
        endpointURL: '/graphql',
      },
    },
    route: {
      auth: false,
    },
  },
  {
    register: graphqlHapi,
    options: {
      path: '/graphql',
      graphqlOptions: request => ({
        schema,
        pretty: true,
        graphiql: true,
        rootValue: request,
      }),
      route: {
        cors: true,
      },
    },
  },
];
