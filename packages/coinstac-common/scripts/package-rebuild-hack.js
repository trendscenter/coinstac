'use strict';

const cp = require('child_process');
const path = require('path');

console.log([
  'see @https://github.com/electron/electron-rebuild#node-pre-gyp-workaround.',
  'electron-rebuild doesn\'t exec reliably accross machines, so assuming you',
  '`npm install`ed with a node version ~== electron version (similair v8s), ',
  'we will attempt to manually migrate your binary addons into the electron path. ',
  'NOTE: as coinstac-ui progresses it\'s electron-prebuilt version, so will this',
  'script need to revise it\'s path targets!',
].join(' '));


console.log('migrating sqlite3...');
const binaryRoot = path.join(__dirname, '..', 'node_modules/sqlite3/lib/binding');
const oldPath = path.join(binaryRoot, 'node-v48-darwin-x64');
const newPath = path.join(binaryRoot, 'electron-v1.2-darwin-x64');

cp.execSync(`cp -r ${oldPath} ${newPath}`);
