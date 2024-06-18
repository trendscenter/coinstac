'use strict';

/* eslint-disable import/no-extraneous-dependencies */
const pify = require('util').promisify;
const CoinstacClient = require('coinstac-client-core');
const rimraf = require('rimraf');

const dir = CoinstacClient.getDefaultAppDirectory();

/* eslint-disable no-console */
console.log(`Removing ${dir} …`);

pify(rimraf)(dir)
  .then(() => console.log('Removed!'))
  .catch(console.error);
/* eslint-enable no-console */
