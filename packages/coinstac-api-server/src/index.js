/* eslint-disable no-console */
const { ApolloServer } = require('apollo-server-hapi');
const hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const helperFunctions = require('./auth-helpers');
const routes = require('./routes');
const { schema } = require('./data/schema');
const database = require('./database');
const {
  eventEmitter,
  WS_CONNECTION_STARTED,
  WS_CONNECTION_TERMINATED,
} = require('./data/events');

async function startServer() {
  const server = new ApolloServer({
    schema,
    formatError: (err) => {
      console.error(err);
      return err;
    },
    context: (contextao) => {
      const { connection, request } = contextao;
      if (connection) {
        return connection.context;
      }

      return {
        credentials: request.auth ? request.auth.credentials : null,
      };
    },
    subscriptions: {
      async onConnect(connectionParams, ws) {
        if (!connectionParams.authToken) {
          return false;
        }

        try {
          const connectionId = ws.upgradeReq.headers['sec-websocket-key'];
          const { id } = await helperFunctions.decodeToken(connectionParams.authToken);

          eventEmitter.emit(WS_CONNECTION_STARTED, connectionId, id);
          return true;
        } catch (error) {
          return false;
        }
      },
      onDisconnect(ws) {
        const connectionId = ws.upgradeReq.headers['sec-websocket-key'];
        eventEmitter.emit(WS_CONNECTION_TERMINATED, connectionId);
      },
    },
  });
  await server.start();

  const app = new hapi.Server({
    host: process.env.API_SERVER_HOSTNAME,
    port: process.env.API_SERVER_PORT,
  });

  await app.register(Jwt);

  app.auth.strategy('coinstac-jwt', 'jwt',
    {
      keys: {
        key: process.env.API_JWT_SECRET,
        algorithms: ['HS256'],
      },
      validate: helperFunctions.validateToken,
      verify: {
        aud: helperFunctions.audience,
        iss: helperFunctions.issuer,
        sub: helperFunctions.subject,
        nbf: true,
        exp: true,
        maxAgeSec: 43200, // 24 hours
        timeSkewSec: 15,
      },
    });

  app.auth.default('coinstac-jwt');
  app.route(routes);

  await server.applyMiddleware({
    app,
  });

  await server.installSubscriptionHandlers(app.listener);

  await app.start();

  console.log(`Server running at: ${app.info.uri}`); // eslint-disable-line no-console
}

database.connect()
  .then(() => {
    return startServer();
  })
  .catch((err) => {
    console.error(err);
  });
