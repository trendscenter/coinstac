'use strict';

require('./diehard')();
const path = require('path');
const sim = require('coinstac-simulator');

let toRun = [
  'declarations/group-add.js',
  'declarations/plugin-group-step.js',
  'declarations/process-files.js',
  'declarations/process-dir.js',
  'declarations/computation-error-handled.js',
  '../node_modules/coinstac-example-computation-bisect-converge/test/declaration.js',
  // '../node_modules/decentralized-laplacian-ridge-regression/test/declaration.js',
];

toRun = toRun.map((f) => path.resolve(__dirname, f));

console.log(`---\nSIMULATION PLAN: ${toRun.length} simulations\n---`);

toRun.reduce(
  (chain, filename, ndx) => { // eslint-disable-line
    return chain.then(() => {
      console.log(`\nSIMULATION (${ndx + 1}/${toRun.length}): ${path.basename(filename)}`);
      return sim.setup(filename).then(() => sim.teardown());
    });
  },
  Promise.resolve()
);
