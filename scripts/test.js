'use strict';

/**
 * Test.
 *
 * Run all COINSTAC packages' tests in parallel, except for
 * coinstac-decentralized-algorithm-integration, which must be run separately.
 * Exit if any of the tests fail.
 */
const async = require('async');
const exec = require('shelljs').exec;

function getExec(dirPath, callback) {
  return exec('npm test', {
    async: true,
    cwd: dirPath,
    silent: false,
  }, (exitCode, stdout, stderr) => {
    if (exitCode) {
      callback(stderr.toString());
    } else {
      callback(null, stdout.toString());
    }
  });
}

async.series([
  cb1 => {
    const children = [];
    const dirPaths = [
      './packages/coinstac-client-core',
      './packages/coinstac-common',
      './packages/coinstac-server-core',
      './packages/coinstac-storage-proxy',
      './packages/coinstac-ui',
    ];

    async.parallel(dirPaths.map(dirPath => {
      return cb1a => children.push(getExec(dirPath, cb1a));
    }), (error, response) => {
      if (error) {
        cb1(error);
      } else {
        cb1(null, response);
      }
      children.forEach(c => c.kill());
    });
  },
  cb2 => {
    getExec('./packages/coinstac-decentralized-algorithm-integration', cb2);
  },
], (error, results) => {
  /* eslint-disable no-console */
  if (error) {
    console.error(error);
  } else {
    console.log(results);
  }
  /* eslint-enable no-console */
});

