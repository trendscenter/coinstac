const prom = require('bluebird').promisify;
const packager = prom(require('electron-packager'));
const zip = require('tar.gz');
const fs = require('fs');
const os = require('os');
const rebuild = require('electron-rebuild');
const electron = require('electron-prebuilt');
const childProcess = require('child_process');

const options = {
  asar: true,
  dir: `${__dirname}/../`,
  icon: `${__dirname}/../app/render/images/logo`,
  name: 'coinstac',
  overwrite: true,
  prune: true,
};

const buildNative = () => {
  return rebuild.shouldRebuildNativeModules(electron)
  .then(should => {
    if (should) {
      let electronVersion = childProcess.execSync(`${electron} --version`, {
        encoding: 'utf8',
      });
      electronVersion = electronVersion.match(/v(\d+\.\d+\.\d+)/)[1];

      return rebuild.installNodeHeaders(electronVersion)
      .then(() => rebuild.rebuildNativeModules(electronVersion, `${__dirname}/../node_modules`));
    }
  });
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
