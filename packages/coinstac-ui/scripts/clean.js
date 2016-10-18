'use strict';

const bluebird = require('bluebird');
const CoinstacClient = require('coinstac-client-core');
const rimraf = require('rimraf');

const dir = CoinstacClient.getDefaultAppDirectory();

/* eslint-disable no-console */
console.log(`Removing ${dir} …`);

bluebird.promisify(rimraf)(dir)
  .then(() => console.log('Removed!'))
  .catch(console.error);
/* eslint-enable no-console */

