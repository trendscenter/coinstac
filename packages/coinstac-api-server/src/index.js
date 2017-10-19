const hapi = require('hapi');
const config = require('../config/default');
const dbmap = require('/cstacDBMap');
const helperFunctions = require('./auth-helpers');
const plugins = require('./plugins');
const routes = require('./routes');

const server = new hapi.Server();
server.connection({
  host: config.host,
  port: config.hapiPort,
});

server.register(plugins, (err) => {
  if (err) {
    console.log(err);
  }

  /**
   * JWT middleware validates token on each /graphql request
   * User object with permissions returned from validateToken function
   */
  server.auth.strategy('jwt', 'jwt',
    {
      key: dbmap.cstacJWTSecret,
      validateFunc: helperFunctions.validateToken,
      verifyOptions: { algorithms: ['HS256'] },
    }
  );

  server.auth.default('jwt');
  server.route(routes);
});

server.start((startErr) => {
  if (startErr) throw startErr;
  console.log(`Server running at: ${server.info.uri}`);
});
