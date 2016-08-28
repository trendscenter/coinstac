'use strict';

const convict = require('convict');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '..', '..', 'config');

function validateFile(value) {
  if (value !== false || typeof value !== 'string') {
    throw new Error(`Invalid file ${value}`);
  }
}

const config = convict({
  backend: {
    format: Boolean,
  },
  config: {
    file: {
      format: validateFile,
    },
  },
  log: {
    file: {
      format: validateFile,
    },
    level: {

      format: function validateFormat(value) {
        if (['debug', 'info', 'warning', 'error', 'none'].indexOf(value) < 0) {
          throw new Error(`Invalid log.level ${value}`);
        }
      },
    },
  },
  port: {
    format: 'port',
  },
  timeout: {
    format: 'nat',
  },
  verbose: {
    format: Boolean,
  },
});

config.loadFile(
  ['default.json', 'local.json'].reduce((memo, fileName) => {
    const filePath = path.join(configPath, fileName);

    try {
      fs.statSync(filePath);
      memo.push(filePath);
    } catch (error) {} // eslint-disable-line no-empty

    return memo;
  }, [])
);

config.validate();

module.exports = config.getProperties();
