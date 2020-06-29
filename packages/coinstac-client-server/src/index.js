const hapi = require('@hapi/hapi');
const http2 = require('http2');
const config = require('./config');

process.LOGLEVEL = 'silly';

const init = async () => {
  const server = hapi.Server({
    listener: http2.createServer(),
    host: config.host,
    port: config.hapiPort,
  });

  const routes = await require('./routes'); // eslint-disable-line global-require

  server.route(routes);

  await server.start();

  console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
};

init();
