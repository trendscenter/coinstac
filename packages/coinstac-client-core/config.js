'use strict';

const convict = require('convict');

const conf = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development', 'release'],
    default: 'development',
    env: 'NODE_ENV',
  },
  baseUrl: {
    doc: 'steelpenny url',
    format: 'url',
    default: 'https://coins-api.mrn.org:443',
    env: 'STEELPENNY_URL',
  },
});

/* istanbul ignore next */
if (process.env.NODE_ENV === 'development' && !process.env.STEELPENNY_URL) {
  conf.set('baseUrl', 'http://localhost:8800');
}

module.exports = conf;
