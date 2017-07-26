const hapi = require('hapi');
const { graphiqlHapi, graphqlHapi } = require('apollo-server-hapi');
const schema = require('./data/schema');

const server = new hapi.Server();
server.connection({
  host: 'localhost',
  port: 3100,
});

const io = require('socket.io')(server);

server.register([
  {
    register: graphiqlHapi,
    options: {
      path: '/graphiql',
      graphiqlOptions: {
        endpointURL: '/graphql',
      },
    },
  },
  {
    register: graphqlHapi,
    options: {
      path: '/graphql',
      graphqlOptions: {
        schema,
        pretty: true,
        graphiql: true,
      },
      route: {
        cors: true,
      },
    },
  },
], () =>
  server.start((err) => {
    if (err) throw err;
    console.log(`Server running at: ${server.info.uri}`);
  })
);
