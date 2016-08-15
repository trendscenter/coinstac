const prom = require('bluebird').promisify;
const packager = prom(require('electron-packager'));
const zip = require('tar.gz');
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
  console.log(`Finished building at: ${appPath}`); // eslint-disable-line no-console
  console.log('Now tarring...'); // eslint-disable-line no-console
  const dir = `${__dirname}/../coinstac-${os.platform()}-${os.arch()}`;

  const read = zip().createReadStream(`${dir}`);
  const write = fs.createWriteStream(`${dir}.tar.gz`);

  read.pipe(write);
  write.on('close', () => {
    console.log(`Finished zipping ${dir}`); // eslint-disable-line no-console
  });
})
.catch(err => {
  console.log(`Build failed with: ${err}`); // eslint-disable-line no-console
});
