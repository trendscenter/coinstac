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

const apiEndPoint = process.env.NODE_ENV === 'development'
  ? 'coinstacdev01.rs.gsu.edu' : 'coinstac.rs.gsu.edu';
const conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development'],
    default: 'production',
    env: 'NODE_ENV',
  },
  apiServer: {
    hostname: apiEndPoint,
    pathname: '/api',
    protocol: 'https:',
  },
  subApiServer: {
    hostname: apiEndPoint,
    pathname: '/ws',
    port: '443',
    protocol: 'wss:',
  },
  fileServer: {
    hostname: apiEndPoint,
    pathname: '/transfer',
    port: '443',
    protocol: 'https:',
  },
  mqttServer: {
    hostname: apiEndPoint,
    pathname: '',
    port: '80',
    protocol: 'mqtts:',
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
});

module.exports = function loadConfig() {
  if (conf.get('env') === 'production') {
    return Promise.resolve(conf);
  }

  return fileExists(localConfig)
    .then((exists) => {
      if (exists) {
        conf.loadFile(localConfig);
      }
      return conf;
    });
};
