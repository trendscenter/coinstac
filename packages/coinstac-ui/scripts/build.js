const prom = require('bluebird').promisify;
const packager = prom(require('electron-packager'));
const archiver = require('archiver');
const fs = require('fs');
const os = require('os');
const buildNative = require('./utils/build-native.js');

const options = {
  asar: true,
  dir: `${__dirname}/../`,
  icon: `${__dirname}/../app/render/images/logo`,
  name: 'coinstac',
  overwrite: true,
  prune: true,
};

// TODO: build mult arch when possible
buildNative()
.then(() => {
  options.arch = os.arch();
  options.platform = os.platform();
  return packager(options);
})
.then((appPath) => {
  let zip;
  const dir = `${__dirname}/../coinstac-${os.platform()}-${os.arch()}`;

  console.log(`Finished building at: ${appPath}`); // eslint-disable-line no-console
  console.log('Now archiving...'); // eslint-disable-line no-console

  if (os.platform() === 'win32') {
    zip = archiver.create('zip');
  } else {
    zip = archiver.create('tar', { gzip: true });
  }
  const write = fs.createWriteStream(os.platform() === 'win32' ? `${dir}.zip` : `${dir}.tar.gz`);

  zip.pipe(write);
  zip.on('error', (err) => {
    throw err;
  });
  zip.directory(dir);
  write.on('close', () => {
    console.log(`Finished zipping ${dir}`); // eslint-disable-line no-console
  });
})
.catch(err => {
  console.log(`Build failed with: ${err}`); // eslint-disable-line no-console
});
