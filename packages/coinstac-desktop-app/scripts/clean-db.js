'use strict';

/* eslint-disable import/no-extraneous-dependencies */

// find ~/.coinstac/* ! -name computations -maxdepth 0 -exec rm -rf '{}' \\;

const pify = require('util').promisify;
const CoinstacClient = require('coinstac-client-core');
const compact = require('lodash/compact');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const dir = CoinstacClient.getDefaultAppDirectory();
const rimrafAsync = pify(rimraf);
const statAsync = pify(fs.stat);

/* eslint-disable no-console */
console.log('Removing local dbs…');

pify(fs.readdir)(dir)
  .then(files => Promise.all(files.map((file) => {
    const fullPath = path.join(dir, file);

    return statAsync(fullPath).then(stats => (stats.isDirectory() && file !== 'computations'
      ? fullPath
      : undefined));
  })))
  .then(compact)
  .then(fullPaths => Promise.all(fullPaths.map(fullPath => rimrafAsync(fullPath).then(() => {
    console.log(`Removed ${fullPath}`);
  }))))
  .catch(console.error);
/* eslint-enable no-console */
