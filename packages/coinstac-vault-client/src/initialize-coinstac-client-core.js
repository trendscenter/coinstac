/* eslint-disable no-console */
const CoinstacClientCore = require('coinstac-client-core');
const winston = require('winston');
const path = require('path');
const mkdirp = require('mkdirp');

const appDirectory = path.resolve('/tmp/.coinstac') || process.env.COINSTAC_HEADLESS_WORKDIR;

async function create(config, authToken) {
  let core = null;

  const logger = winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({
        level, message, timestamp,
      }) => `${timestamp} { message: ${message}, level: ${level} }`)
    ),
    transports: [new winston.transports.Console()],
  });
  await mkdirp(appDirectory);
  const clientCoreConfig = {
    fileServer: {
      hostname: process.env.FILE_SERVER_HOSTNAME,
      pathname: process.env.FILE_SERVER_PATHNAME,
      port: process.env.FILE_SERVER_PORT,
      protocol: process.env.FILE_SERVER_PROTOCOL,
    },
    mqttServer: {
      hostname: process.env.MQTT_SERVER_HOSTNAME,
      pathname: process.env.MQTT_SERVER_PATHNAME,
      port: process.env.MQTT_SERVER_PORT,
      protocol: process.env.MQTT_SERVER_PROTOCOL,
    },
    mqttWSServer: {
      hostname: process.env.MQTT_WS_SERVER_HOSTNAME,
      pathname: process.env.MQTT_WS_SERVER_PATHNAME,
      port: process.env.MQTT_WS_SERVER_PORT,
      protocol: process.env.MQTT_WS_SERVER_PROTOCOL,
    },
    token: authToken,
    userId: config.id,
    appDirectory,
    logger,
    containerService: 'docker',
  };

  core = new CoinstacClientCore(clientCoreConfig);
  await core.initialize();

  return core;
}

module.exports = {
  create,
};
