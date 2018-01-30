const prom = require('bluebird').promisify;
const packager = prom(require('electron-packager'));
const archiver = require('archiver');
const fs = require('fs');
const rm = require('rimraf');
const os = require('os');
const bb = require('bluebird');
const path = require('path');

const platform = os.platform();
const dirName = `coinstac-${platform}-${os.arch()}`;
const outputDir = `${__dirname}/../${dirName}`;
const zip = platform === 'win32' ?
  archiver.create('zip') : archiver.create('tar', { gzip: true });
const zipOutput = platform === 'win32' ? `${outputDir}.zip` : `${outputDir}.tar.gz`;
const options = {
  asar: true,
  dir: `${__dirname}/../`,
  name: 'coinstac',
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

// TODO: build mult arch when possible
bb.promisify(rm)(zipOutput)
.then(() => {
  options.arch = os.arch();
  options.platform = platform;
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
  zip.directory(outputDir, dirName)
  .finalize();

  write.on('close', () => {
    console.log(`Finished zipping ${outputDir}`); // eslint-disable-line no-console
  });
})
.catch((err) => {
  console.log(`Build failed with: ${err}`); // eslint-disable-line no-console
});
