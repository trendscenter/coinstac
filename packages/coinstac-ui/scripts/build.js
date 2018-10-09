const pify = require('util').promisify;
const packager = pify(require('electron-packager'));
const archiver = require('archiver');
const fs = require('fs');
const rm = pify(require('rimraf'));
const os = require('os');
const path = require('path');

const options = {
  all: true,
  asar: true,
  dir: `${__dirname}/../`,
  name: 'coinstac',
  out: path.join(__dirname, '..', 'build', 'apps'),
  overwrite: true,
  prune: true,
};

if (platform === 'darwin') {
  options.icon = path.resolve(__dirname, '../img/icons/coinstac.icns');
} else if (platform === 'win32') {
  options.icon = path.resolve(__dirname, '../img/icons/coinstac.ico');
} else {
  options.icon = path.resolve(__dirname, '../img/icons/png/256x256.png');
}

rm('coinstac-*')
.then(() => {
  options.arch = os.arch();
  options.platform = platform;
  return packager(options);
})
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
  console.log(`Build failed with: ${err}`); // eslint-disable-line no-console
});
