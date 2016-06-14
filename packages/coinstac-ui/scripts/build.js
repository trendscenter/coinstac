const packager = require('electron-packager');
const zip = require('tar.gz');
const fs = require('fs');
const options = {
  arch: 'all',
  asar: true,
  dir: `${__dirname}/../`,
  icon: `${__dirname}/../app/render/images/logo`,
  name: 'coinstac',
  overwrite: true,
  platform: 'all',
  prune: true,
  version: '1.1.1',
};
const outputDirs = [
  'coinstac-darwin-x64',
  'coinstac-linux-ia32',
  'coinstac-linux-x64',
  'coinstac-mas-x64',
  'coinstac-win32-ia32',
  'coinstac-win32-x64',
];

packager(options, (err, appPaths) => {
  if (err) {
    console.log(`Build failed with: ${err}`); // eslint-disable-line no-console
  } else {
    console.log(`Finished building at: ${appPaths}`); // eslint-disable-line no-console
    console.log('Now tarring...'); // eslint-disable-line no-console

    outputDirs.forEach((dir) => {
      const read = zip().createReadStream(`./${dir}`);
      const write = fs.createWriteStream(`./${dir}.tar.gz`);

      read.pipe(write);
      write.on('close', () => {
        console.log(`Finished zipping ${dir}`); // eslint-disable-line no-console
      });
    });
  }
});
