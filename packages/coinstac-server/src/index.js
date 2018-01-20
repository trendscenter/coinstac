const hapi = require('hapi');
const CoinstacComputationRegistry = require('coinstac-computation-registry');
const config = require('../config/default');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path
const routes = require('./routes');

// Download computations on remote server on server start
const computationRegistry = new CoinstacComputationRegistry();
computationRegistry.serverStart();

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
