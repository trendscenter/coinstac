'use strict';

/**
 * Test.
 *
 * Run all COINSTAC packages' tests in parallel, except for
 * coinstac-decentralized-algorithm-integration, which must be run separately.
 * Exit if any of the tests fail.
 */
const async = require('async');
const shelljs = require('shelljs');
const path = require('path');

const children = [];
const packages = shelljs.ls(path.resolve(__dirname, '../packages/')).stdout
  .split('\n')
  .reduce((memo, packageDir) => (
    packageDir.trim() ?
      memo.concat(path.resolve(__dirname, `../packages/${packageDir}`)) :
      memo
  ), []);

function getExec(dirPath, callback) {
  const child = shelljs.exec('npm test', {
    cwd: dirPath,
    env: Object.assign({}, process.env, {
      BLUEBIRD_WARNINGS: 0,
    }),
    silent: false,
  }, (exitCode) => {
    if (exitCode) {
      callback(`Tests in ${dirPath} exitied with code ${exitCode}`);
    } else {
      callback(null, dirPath);
    }
  });

  children.push(child);
}

function killChildren() {
  children.forEach(c => c && c.kill());
}

process.on('exit', killChildren);

async.mapSeries(
  packages,
  (dirPath, cb) => getExec(dirPath, cb),
  (error) => {
    killChildren(); // Ensure child processes are killed

    /* eslint-disable no-console */
    if (error) {
      console.error(error);
    }
    /* eslint-enable no-console */
  }
);

