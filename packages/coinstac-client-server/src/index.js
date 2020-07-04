const hapi = require('@hapi/hapi');
const nes = require('nes');
const path = require('path');
const PipelineManager = require('coinstac-pipeline');
const config = require('./config');
const routes = require('./routes');

process.LOGLEVEL = 'silly';

const init = async () => {
  const manager = await PipelineManager.create({
    mode: 'remote',
    clientId: 'remote',
    operatingDirectory: path.resolve(config.operatingDirectory, 'coinstac'),
    remotePort: 3400,
    mqttRemotePort: config.mqttServer.port,
    mqttRemoteProtocol: config.mqttServer.protocol,
    mqttRemoteURL: config.mqttServer.hostname,
  });

  const server = hapi.Server({
    host: config.host,
    port: config.hapiPort,
  });

  await server.register(nes);

  server.route(routes(manager, server));

  await server.start();

  server.subscription('/pipelineResult');

  console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
};

init();
