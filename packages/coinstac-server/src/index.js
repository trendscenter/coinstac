/* eslint-disable no-unused-vars */
const hapi = require('hapi');
const CoinstacComputationRegistry = require('coinstac-computation-registry');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path, import/no-unresolved
const config = require('../config/default');
const routes = require('./routes');

// Download computations on remote server on server start
const computationRegistry = new CoinstacComputationRegistry({ credentials: dbmap.rethinkdbServer });

// TODO: Uncomment below when SSR and MSR are on docker hub
// computationRegistry.serverStart();

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
