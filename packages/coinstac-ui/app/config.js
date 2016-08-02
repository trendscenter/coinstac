'use strict';

const convict = require('convict');
const bluebird = require('bluebird');
const access = bluebird.promisify(require('fs').access);
const path = require('path');
const localConfig = path.resolve(__dirname, '..', 'config', 'local.json');

const fileExists = (fPath) => {
  return access(fPath)
  .then(res => {
    return true
  }).catch(err => {
    return false;
  });
};

const conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development'],
    default: 'production',
    env: 'NODE_ENV',
  },
  api: {
    hostname: 'coins-api.mrn.org',
    pathname: '/api/v1.3.0',
    protocol: 'https:',
  },
  db: {
    remote: {
      db: {
        hostname: 'coinstac.mrn.org',
        pathname: '',
        protocol: 'https:',
      }
    },
    noURLPrefix: true
  },
  logFile: 'coinstac-log.json',
  logLocations: {
    darwin: '~/Library/Logs/coinstac/',
    freebsd: '~/.config/coinstac/',
    linux: '~/.config/coinstac/',
    sunos: '~/.config/coinstac/',
    win32: '$HOME/AppData/Roaming/coinstac/',
  },
});

module.exports = function loadConfig() {
  if (conf.get('env') === 'production') {
    return Promise.resolve(conf);
  }

  return fileExists(localConfig)
  .then(exists => {
    if (exists) {
      conf.loadFile(localConfig);
    }
    return conf;
  });
};
