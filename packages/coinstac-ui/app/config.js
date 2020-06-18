'use strict';

const convict = require('convict');
const pify = require('util').promisify;
const access = pify(require('fs').access);
const path = require('path');
const home = require('os').homedir;

const localConfig = path.resolve(__dirname, '..', 'config', 'local.json');

const fileExists = (fPath) => {
  return access(fPath).then(() => true, () => false);
};

const conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development'],
    default: 'production',
    env: 'NODE_ENV',
  },
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
  fileServer: {
    hostname: 'localhost',
    pathname: '/transfer',
    port: '3300',
    protocol: 'http:',
  },
  mqttServer: {
    hostname: 'localhost',
    pathname: '',
    port: '1883',
    protocol: 'mqtt:',
  },
  logFile: 'coinstac-log.json',
  logFileBoot: 'coinstac-boot-error-log.txt',
  // these are appended to the home dir for you OS
  // *nix: ~/.config/coinstac
  // win: C:\Users\username\AppData\Local\Temp\coinstac
  logLocations: {
    darwin: 'Library/Logs/coinstac/',
    freebsd: '.config/coinstac/',
    linux: '.config/coinstac/',
    sunos: '.config/coinstac/',
    win32: 'coinstac/',
  },
  coinstacHome: path.join(home(), '.coinstac'),
  remoteURL: path.join(home(), '.coinstac'),
});

module.exports = function loadConfig() {
  return fileExists(localConfig)
    .then((exists) => {
      if (exists) {
        conf.loadFile(localConfig);
      }
      return conf;
    });
};
