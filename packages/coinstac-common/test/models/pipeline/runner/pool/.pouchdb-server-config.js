'use strict';

const url = require('url');

const config = {
    backend: false, // e.g. memdown
    config: { file: false },
    log: { file: false },
    port: 5985,
    timeout: 10000, // in ms
    verbose: false
};

config.dbURL = function(dbname) {
  if (!dbname) { throw new ReferenceError('dbname required'); }
  return url.format({
    protocol: 'http',
    hostname: 'localhost',
    port: config.port,
    pathname: dbname
  });
};

module.exports = config;
