/* eslint-disable no-console */
'use strict';

const async = require('async');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const superagent = require('superagent');

const COMPUTATIONS_DIRECTORY = path.join(
  os.tmpdir(),
  'coinstac-server-core',
  'computations'
);

const DATABASE_DIRECTORY = path.join(
  os.tmpdir(),
  'coinstac-server-core',
  'dbs'
);

async.parallel([
  cb1 => {
    async.parallel([
      cb1a => {
        console.log('Removing database dir…');
        rimraf(DATABASE_DIRECTORY, error => {
          if (error) {
            cb1a(error);
          } else {
            console.log('Database dir removed');
            cb1a(null);
          }
        });
      },
      cb1b => {
        console.log('Removing computations dir…');
        rimraf(COMPUTATIONS_DIRECTORY, error => {
          if (error) {
            cb1b(error);
          } else {
            console.log('Computations dir removed');
            cb1b(null);
          }
        });
      },
    ], cb1);
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

