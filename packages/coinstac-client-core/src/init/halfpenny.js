'use strict';

const conf = require('./../../config.js');
const hpFactory = require('halfpenny');
const LocalStorage = require('node-localstorage').LocalStorage;
const axios = require('axios');

/**
 * builds a ready-to-go api client!
 * @param {object} opts
 * @param {string} opts.storagePath
 * @param {LocalStorage} [opts.storage]
 * @returns {Halfpenny}
 */
function initializeAPIClient(opts) {
  const hpConf = {
    agent: axios,
    baseUrl: conf.get('baseUrl'),
    store: opts.storage ? opts.storage : new LocalStorage(opts.storagePath),
  };
  return hpFactory(hpConf);
}

module.exports = initializeAPIClient;
