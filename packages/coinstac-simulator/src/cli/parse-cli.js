'use strict';
const program = require('commander');
const path = require('path');
const pkgPath = path.resolve(__dirname, '../../package.json');
const pkg = require(pkgPath);

program
  .version(pkg.version)
  .option('-d, --declaration [path]', '/path/to/declaration');

program.on('--help', () => {
  console.log([ // eslint-disable-line
    '\tTest a DecentralizedComputation in a COINSTAC simulated environment.\n\n',
    '\tPlease provide a `declaration` specifying how to run your simulation.',
    '\tFor examples on how to define a declaration, see:\n',
    `\t${pkg.homepage}/tree/master/test/declarations.\n\n`,
    '\tExample:\n\n',
    '\t  coinstac-sim -d my-delcaration.js',
  ].join(' '));
});

program.parse(process.argv);

if (!program.declaration) {
  console.error('ERROR: declaration path required (-d)'); // eslint-disable-line
  process.exit(1);
}
module.exports = program;
