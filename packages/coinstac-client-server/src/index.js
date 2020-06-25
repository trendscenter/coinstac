const hapi = require('hapi');

process.LOGLEVEL = 'silly';

const config = require('./config');
const routes = require('./routes');

const server = new hapi.Server();
server.connection({
  host: config.host,
  port: config.hapiPort,
});

server.route(routes);
server.start((startErr) => {
  if (startErr) throw startErr;
  console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
});
