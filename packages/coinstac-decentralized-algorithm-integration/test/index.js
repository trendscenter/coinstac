'use strict';

require('perish');
const path = require('path');
const sim = require('coinstac-simulator');

let toRun = [
  'declarations/group-add.js',
  'declarations/plugin-group-step.js',
  'declarations/plugin-group-step-seeder.js',

  /**
   * process-dir and process-files rely on `dirs` `filenames`, respectively,
   * being passed to Python scripts. Changes for
   * {@link https://github.com/MRN-Code/coinstac/issues/159} make this no longer
   * occur, and the Python scripts error out.
   *
   * Related: {@link https://github.com/MRN-Code/coinstac/issues/161}
   *
   * @todo Uncomment proces-dir and process-files and once coinstac-simulator
   * passes complete data structures from the declaration file.
   */
  // 'declarations/process-files.js',
  // 'declarations/process-dir.js',

  /**
   * @todo Asynchronous/parallel execution of python scripts on CI servers with
   * pyenv causes the processes to exit with a shim rehash error. Re-enable the
   * computation-error-handled.js declaration when a pyenv 'no-rehash' option is
   * available.
   *
   * {@link https://github.com/MRN-Code/coinstac/pull/221#issuecomment-303450215}
   * {@link https://github.com/pyenv/pyenv/pull/350#issuecomment-303472897}
   */
  // 'declarations/computation-error-handled.js',

  /**
   * Due to the required `covariates` computation input bisect-converge is
   * commented out. Making its integration test pass requires modifying the
   * computation and bumping.
   *
   * @todo Drop `covariates` computation input requirement and un-comment
   * bisect-converge.
   *
   * {@link https://github.com/MRN-Code/coinstac/issues/161}
   */
  // 'declarations/bisect-converge.js',
  // '../node_modules/decentralized-laplacian-ridge-regression/test/declaration.js',
];

toRun = toRun.map(f => path.resolve(__dirname, f));

/* eslint-disable no-console */
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
/* eslint-enable no-console */
