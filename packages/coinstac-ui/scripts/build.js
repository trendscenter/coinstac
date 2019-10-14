const pify = require('util').promisify;
const packager = pify(require('electron-packager'));
const archiver = require('archiver');
const fs = require('fs');
const rm = pify(require('rimraf'));
const path = require('path');

const rename = pify(fs.rename);
const copy = pify(fs.copyFile);

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

rm('../build/apps/coinstac-*')
  .then(() => rename('../config/local.json', '../config/local-build-copy.json'))
  .then(() => {
    if (process.argv[2] && process.argv[2] === 'development') {
      return copy(process.argv[2] && process.argv[2] === 'development');
    } else if (process.argv[2] && process.argv[2] === 'production') { // eslint-disable-line no-else-return
      return copy(process.argv[2] && process.argv[2] === 'production');
    }
  })
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
  .then(() => rename('../config/local-build-copy.json', '../config/local.json'))
  .catch((err) => {
    console.error('Build failed with:', err); // eslint-disable-line no-console
  });
