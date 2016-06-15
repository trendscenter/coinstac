'use strict';

const testDirectory = require('./test-directory.js');

module.exports = {
  api: {
    protocol: 'https',
    hostname: 'localcoin.mrn.org',
    port: 8443,
    pathname: '/api/v1.3.0',
  },
  db: {
    path: testDirectory,
    pouchConfig: {
      adapter: 'memory',
    },
    remote: {
      db: {
        protocol: 'http',
        hostname: 'localhost',
        // Use a bad port so that PouchDB doesn’t use CouchDB for testing:
        port: 5985,
      },
    },
  },
};
