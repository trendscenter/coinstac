const pify = require('util').promisify;
const packager = require('electron-packager');
const archiver = require('archiver');
const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const rm = pify(require('rimraf'));
const path = require('path');


const options = {
  // all: true,
  asar: true,
  dir: `${__dirname}/../`,
  icon: path.resolve(__dirname, '../img/icons/coinstac'),
  name: 'coinstac',
  out: path.join(__dirname, '..', 'build', 'apps'),
  overwrite: true,
  prune: true,
};
rm('./build/apps/coinstac-*')
  .then(() => fs.rename('./config/local.json', './config/local-build-copy.json'))
  .catch((e) => {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  })
  .then(() => {
    if (process.argv[2] && process.argv[2] === 'development') {
      console.log('Creating development build'); // eslint-disable-line no-console
      return fs.copyFile('./config/local-development.json', './config/local.json');
    } else if (process.argv[2] && process.argv[2] === 'production') { // eslint-disable-line no-else-return
      console.log('Creating production build'); // eslint-disable-line no-console
      return fs.copyFile('./config/local-production.json', './config/local.json');
    }
  })
  .then(() => packager(options))
  .then((appPaths) => {
    return Promise.all(appPaths.map(async (appPath) => {
      await fs.rename(path.join(appPath, 'LICENSE'), path.join(appPath, 'LICENSE.electron'));
      await fs.copyFile(path.join('.', 'LICENSE'), path.join(appPath, 'LICENSE'));
      await new Promise((resolve, reject) => {
        const zip = archiver.create('zip');
        console.log(`Finished building at: ${appPath}`); // eslint-disable-line no-console
        console.log('Now archiving...'); // eslint-disable-line no-console

        const write = createWriteStream(`${appPath}.zip`);

        zip.pipe(write);
        zip.on('error', (err) => {
          reject(err);
        });
        zip.directory(appPath, false)
          .finalize();

        write.on('close', () => {
          console.log(`Finished zipping ${appPath}.zip`); // eslint-disable-line no-console
          resolve();
        });
      });
    }));
  })
  .then(() => fs.rename('./config/local-build-copy.json', './config/local.json'))
  .catch((err) => {
    if (err.code !== 'ENOENT') console.error('Build failed with:', err); // eslint-disable-line no-console
  });
