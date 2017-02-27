/* eslint-disable no-console */
'use strict';

const async = require('async');
const CoinstacServer = require('../src/coinstac-server.js');
const rimraf = require('rimraf');
const superagent = require('superagent');
const url = require('url');

/**
 * @todo Don't depend on dbmap.json for secrets.
 *
 * {@link https://github.com/MRN-Code/coinstac/issues/163}
 */
let dbmap;

try {
  /* eslint-disable import/no-unresolved,global-require */
  dbmap = require('/coins/config/dbmap.json');
  /* eslint-enable import/no-unresolved,global-require */
} catch (error) {
  dbmap = {
    coinstac: {
      user: '',
      password: '',
    },
  };
}

const urlBase = url.format({
  auth: dbmap.coinstac ? `${dbmap.coinstac.user}:${dbmap.coinstac.password}` : '',
  hostname: 'localhost',
  port: 5984,
  protocol: 'http',
});

async.parallel([
  cb1 => {
    console.log('Removing database dir…');
    rimraf(CoinstacServer.DB_PATH, error => {
      if (error) {
        cb1(error);
      } else {
        console.log('Database dir removed');
        cb1(null);
      }
    });
  },
  cb2 => {
    async.waterfall([
      cb2a => {
        superagent
          .get(`${urlBase}/_all_dbs`)
          .set('Accept', 'application/json')
          .end(cb2a);
      },
      (response, cb2b) => {
        async.map(
          response.body.filter(name => name.charAt(0) !== '_'),
          (dbName, cb2b1) => {
            superagent
              .delete(`${urlBase}/${dbName}`)
              .set('Accept', 'application/json')
              .end((error, deleteResponse) => {
                const body = deleteResponse.body;

                if (error) {
                  cb2b1(error);
                } else if (!body.ok) {
                  cb2b1(body);
                } else {
                  console.log(`Removed database: ${dbName}`);
                  cb2b1(null);
                }
              });
          },
          cb2b
        );
      },
    ], cb2);
  },
], error => {
  if (error) {
    console.error(error);
  }
});
/* eslint-enable no-console */
