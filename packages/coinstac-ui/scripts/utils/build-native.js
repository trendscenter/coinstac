'use strict';

const cp = require('child_process');
const electron = require('electron-prebuilt');
const promisify = require('bluebird').promisify;

module.exports = function buildNative() {
  const exec = promisify(cp.exec);

  return Promise.all([
    exec(`${electron} --version`, { encoding: 'utf8' }),
    exec(`${electron} --abi`, { encoding: 'utf8' }),
  ])
    .then(([version, abi]) => {
      const electronVersion = version.match(/v(\d+\.\d+\.\d+)/)[1];
      const electronABI = abi.match(/(\d+)/)[1];

      return new Promise((resolve, reject) => {
        const build = cp.spawn('npm', [
          'rebuild',
          '--runtime=electron',
          `--target=${electronVersion}`,
          '--disturl=https://atom.io/download/atom-shell',
          `--abi=${electronABI}`,
        ]);

        build.stdout.pipe(process.stdout);
        build.stderr.pipe(process.stderr);

        build.on('close', code => {
          if (code) {
            reject(new Error(`Rebuild exited with code ${code}`));
          } else {
            resolve();
          }
        });
      });
    })
    .then(() => {
      console.log('Done building native modules'); // eslint-disable-line no-console
    })
    .catch(error => {
      console.log('There was a problem building', error); // eslint-disable-line no-console
    });
};
