const prom = require('bluebird').promisify;
const packager = prom(require('electron-packager'));
const archiver = require('archiver');
const fs = require('fs');
const os = require('os');
const buildNative = require('./utils/build-native.js');

const outputDir = `${__dirname}/../coinstac-${os.platform()}-${os.arch()}`;
const zip = os.platform() === 'win32' ?
  archiver.create('zip') : archiver.create('tar', { gzip: true });
const zipOutput = os.platform() === 'win32' ? `${outputDir}.zip` : `${outputDir}.tar.gz`;
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
  console.log(`Finished building at: ${appPath}`); // eslint-disable-line no-console
  console.log('Now archiving...'); // eslint-disable-line no-console

  const write = fs.createWriteStream(zipOutput);

  zip.pipe(write);
  zip.on('error', (err) => {
    throw err;
  });
  zip.directory(outputDir);
  write.on('close', () => {
    console.log(`Finished zipping ${outputDir}`); // eslint-disable-line no-console
  });
})
.catch(err => {
  console.log(`Build failed with: ${err}`); // eslint-disable-line no-console
});
