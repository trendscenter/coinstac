/* eslint-disable no-console */

'use strict';

const os = require('os');
const path = require('path');
const rimraf = require('rimraf');

console.log('Removing computations dir…');

rimraf(path.join(os.tmpDir(), 'coinstac-server-core'), (error) => {
  if (error) {
    console.error(error);
  } else {
    console.log('Computations dir removed');
  }
});
/* eslint-enable no-console */
