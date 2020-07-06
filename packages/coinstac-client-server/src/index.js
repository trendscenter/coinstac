const hapi = require('@hapi/hapi');
const nes = require('nes');
const config = require('./config');
const routes = require('./routes');

process.LOGLEVEL = 'silly';

const init = async () => {
  const server = hapi.Server({
    host: config.host,
    port: config.hapiPort,
  });

  await server.register(nes);

  server.route(routes(server));

  await server.start();

  server.subscription('/pipelineResult');

  console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
};

init();
