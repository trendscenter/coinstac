const hapi = require('@hapi/hapi');
const nes = require('nes');
const routes = require('./routes');

process.LOGLEVEL = 'silly';

const init = async () => {
  const server = hapi.Server({
    host: process.env.CLIENT_SERVER_HOSTNAME,
    port: process.env.CLIENT_SERVER_PORT,
  });

  await server.register(nes);

  server.route(routes(server));

  await server.start();

  server.subscription('/pipelineResult/{id}');

  console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
};

init();
