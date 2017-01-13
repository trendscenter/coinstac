/* eslint-disable no-console */
'use strict';

const async = require('async');
const CoinstacServer = require('../src/coinstac-server.js');
const rimraf = require('rimraf');
const superagent = require('superagent');

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
          .get('http://localhost:5984/_all_dbs')
          .set('Accept', 'application/json')
          .end(cb2a);
      },
      (response, cb2b) => {
        async.map(
          response.body.filter(name => name.charAt(0) !== '_'),
          (dbName, cb2b1) => {
            superagent
              .delete(`http://localhost:5984/${dbName}`)
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
