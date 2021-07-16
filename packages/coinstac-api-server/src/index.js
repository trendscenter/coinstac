/* eslint-disable no-console */
const { ApolloServer } = require('apollo-server-hapi');
const hapi = require('hapi');
const jwt2 = require('hapi-auth-jwt2');
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
          console.error('An error occurred while establishing a websocket connection', error);
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

  await app.register(jwt2);

  app.auth.strategy('jwt', 'jwt',
    {
      key: process.env.API_JWT_SECRET,
      validate: helperFunctions.validateToken,
      verifyOptions: { algorithms: ['HS256'] },
    });

  app.auth.default('jwt');
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
