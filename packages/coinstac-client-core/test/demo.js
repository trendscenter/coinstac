'use strict';

const async = require('async');
const CC = require('../');

const opts = {
  db: {
    remote: {
      verbose: false,
      db: {
        protocol: 'http',
        hostname: 'localhost',
        port: 8800,
        pathname: 'coinstacdb',
      },
    },
    local: {
      verbose: false,
      pouchConfig: {
        adapter: 'memory',
      },
    },
    noURLPrefix: false,
  },
};
let consortiaDB;

// if (true) {
//   console.log('using couchdb directly, bypassing API/Proxy services');
//   opts.db.noURLPrefix = true;
//   delete opts.db.remote.db.pathname;
//   opts.db.remote.db.port = 5984;
// }

const cc = new CC(opts);

// go
async.series([
  cb => cc.auth.login({ username: 'mochatest', password: 'mochapassword' }, cb),
  cb => cc.initialize(cb),
], (err) => {
  /* eslint-disable no-console */
  if (err) {
    console.error(err && err.message);
    throw err;
  }
  consortiaDB = cc.dbRegistry.get('consortia');
  consortiaDB.all()
    .then(docs => console.log('# DOCS:', docs.length))
    .then(() => {
      consortiaDB.syncEmitter
        .on('change', arg => console.log('change', arg))
      // .on('paused', () => console.log('paused', arguments[0]))
      // .on('active', () => console.log('active', arguments[0]))
        .on('denied', arg => console.log('denied', arg))
        .on('complete', arg => console.log('complete', arg))
        .on('error', arg => console.log('error', arg));
    });
});
/* eslint-enable no-console */
