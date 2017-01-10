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

const children = [];

function getExec(dirPath, callback) {
  const child = exec('npm test', {
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

  children.push(child);

  return child;
}

function killChildren() {
  children.forEach(c => c.kill());
}

process.on('exit', killChildren);

async.series([
  cb1 => {
    const children = [];
    const dirPaths = [
      './packages/coinstac-client-core',
      './packages/coinstac-common',
      './packages/coinstac-computation-registry',
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
    });
  },
  cb2 => {
    getExec('./packages/coinstac-decentralized-algorithm-integration', cb2);
  },
], (error, results) => {
  killChildren(); // Ensure child processes are killed

  /* eslint-disable no-console */
  if (error) {
    console.error(error);
  } else {
    console.log(results);
  }
  /* eslint-enable no-console */
});
