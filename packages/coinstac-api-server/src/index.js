const { ApolloServer } = require('apollo-server-hapi');
const hapi = require('hapi');
const jwt2 = require('hapi-auth-jwt2');
const config = require('../config/default');
const helperFunctions = require('./auth-helpers');
const routes = require('./routes');
const { schema } = require('./data/schema');

async function startServer() {
  const server = new ApolloServer({
    schema,
    context: ({ request, connection }) => {
      if (connection) {
        return connection.context;
      }

      return {
        credentials: request.auth ? request.auth.credentials : null,
      };
    },
  });

  const app = new hapi.Server({
    host: config.host,
    port: config.hapiPort,
  });

  await app.register(jwt2);

  /**
   * JWT middleware validates token on each /graphql request
   * User object with permissions returned from validateToken function
   */
  app.auth.strategy('jwt', 'jwt',
    {
      key: helperFunctions.JWTSecret,
      validate: helperFunctions.validateToken,
      verifyOptions: { algorithms: ['HS256'] },
    });

  app.auth.default('jwt');
  app.route(routes);

  server.applyMiddleware({
    app,
  });

  await server.installSubscriptionHandlers(app.listener);

  await app.start();

  console.log(`Server running at: ${app.info.uri}`); // eslint-disable-line no-console
}

startServer();
