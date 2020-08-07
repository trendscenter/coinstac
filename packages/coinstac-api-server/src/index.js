require('trace');
require('clarify');
const hapi = require('hapi');
const helperFunctions = require('./auth-helpers');
const plugins = require('./plugins');
const routes = require('./routes');
const wsServer = require('./ws-server');
const database = require('./database');

const server = new hapi.Server();
server.connection({
  host: process.env.API_SERVER_HOSTNAME,
  port: process.env.API_SERVER_PORT,
});

server.register(plugins, (err) => {
  if (err) {
    console.log(err); // eslint-disable-line no-console
  }

  /**
   * JWT middleware validates token on each /graphql request
   * User object with permissions returned from validateToken function
   */
  server.auth.strategy('jwt', 'jwt',
    {
      key: process.env.API_JWT_SECRET,
      validateFunc: helperFunctions.validateToken,
      verifyOptions: { algorithms: ['HS256'] },
    });

  server.auth.default('jwt');
  server.route(routes);
});

database.connect()
  .then(() => {
    server.start((startErr) => {
      if (startErr) throw startErr;
      console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
      wsServer.activate(server);
    });
  })
  .catch((err) => {
    console.error(err); // eslint-disable-line no-console
  });
