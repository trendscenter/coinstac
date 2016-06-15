'use strict';

require('perish');
const path = require('path');
const sim = require('coinstac-simulator');

let toRun = [
  'declarations/group-add.js',
  'declarations/plugin-group-step.js',
  'declarations/plugin-group-step-seeder.js',
  'declarations/process-files.js',
  'declarations/process-dir.js',
  'declarations/computation-error-handled.js',
  'declarations/bisect-converge.js',
  // '../node_modules/decentralized-laplacian-ridge-regression/test/declaration.js',
];

toRun = toRun.map((f) => path.resolve(__dirname, f));

console.log(`---\nSIMULATION PLAN: ${toRun.length} simulations\n---`);

toRun.reduce(
  (chain, filename, ndx) => { // eslint-disable-line
    return chain.then(() => {
      console.log(`\nSIMULATION (${ndx + 1}/${toRun.length}): ${path.basename(filename)}`);
      return sim.run(filename);
    });
  },
  Promise.resolve()
);
