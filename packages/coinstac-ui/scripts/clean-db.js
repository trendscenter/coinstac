'use strict';
// find ~/.coinstac/* ! -name computations -maxdepth 0 -exec rm -rf '{}' \\;

const bluebird = require('bluebird');
const CoinstacClient = require('coinstac-client-core');
const compact = require('lodash/compact');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const dir = CoinstacClient.getDefaultAppDirectory();
const rimrafAsync = bluebird.promisify(rimraf);
const statAsync = bluebird.promisify(fs.stat);

/* eslint-disable no-console */
console.log('Removing local dbs…');

bluebird.promisify(fs.readdir)(dir)
  .then(files => Promise.all(files.map(file => {
    const fullPath = path.join(dir, file);

    return statAsync(fullPath).then(stats => {
      return stats.isDirectory() && file !== 'computations' ?
        fullPath :
        undefined;
    });
  })))
  .then(compact)
  .then(fullPaths => Promise.all(fullPaths.map(fullPath => {
    return rimrafAsync(fullPath).then(() => {
      console.log(`Removed ${fullPath}`);
    });
  })))
  .catch(console.error);
/* eslint-enable no-console */

