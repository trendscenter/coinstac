const convict = require('convict');
const path = require('path');

function loadConfig() {
  const config = convict({
    apiServer: {
      hostname: 'localhost',
      pathname: '',
      port: '3100',
      protocol: 'http:',
    },
    subApiServer: {
      hostname: 'localhost',
      pathname: '',
      port: '3100',
      protocol: 'ws:',
    },
  });

  const configFile = path.resolve(__dirname, '..', 'config', 'local.json');
  config.loadFile(configFile);

  return config.getProperties();
}

module.exports = loadConfig;
