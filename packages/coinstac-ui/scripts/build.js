const pify = require('util').promisify;
const packager = pify(require('electron-packager'));
const archiver = require('archiver');
const fs = require('fs');
const rm = pify(require('rimraf'));
const path = require('path');

const options = {
  all: true,
  asar: true,
  dir: `${__dirname}/../`,
  icon: path.resolve(__dirname, '../img/icons/coinstac'),
  name: 'coinstac',
  out: path.join(__dirname, '..', 'build', 'apps'),
  overwrite: true,
  prune: true,
};

rm('coinstac-*')
  .then(() => packager(options))
  .then((appPaths) => {
    appPaths.forEach((appPath) => {
      const zip = archiver.create('zip');
      console.log(`Finished building at: ${appPath}`); // eslint-disable-line no-console
      console.log('Now archiving...'); // eslint-disable-line no-console

      const write = fs.createWriteStream(`${appPath}.zip`);

      zip.pipe(write);
      zip.on('error', (err) => {
        throw err;
      });
      zip.directory(appPath, false)
        .finalize();

      write.on('close', () => {
        console.log(`Finished zipping ${appPath}.zip`); // eslint-disable-line no-console
      });
    });
  })
  .catch((err) => {
    console.error('Build failed with:', err); // eslint-disable-line no-console
  });
