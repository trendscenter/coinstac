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
    default: 'development',
    env: 'NODE_ENV',
  },
  api: {
    protocol: 'https',
    hostname: 'localcoin.mrn.org',
    port: 8443,
  },
  db: {
    remote: {
      db: {
        protocol: 'http',
        hostname: 'localhost',
        port: 443,
        pathname: 'coinstacdb',
      },
    },
    local: {
      pouchConfig: {
        db: 'memdown',
      },
    },
  },
  log: 'logs/log.json',
  logFile: 'constac-log.json',
});

if (!process.env.NODE_ENV === 'development') {
  conf.set('db', { remote: { protocol: 'https', hostname: 'coinsapi.mrn.org', pathname: 'coinstacdb' } });
}

module.exports = function loadConfig() {
  return fileExists(localConfig)
  .then(exists => {
    if (exists) {
      conf.loadFile(localConfig);
    }
    return conf;
  });
};
