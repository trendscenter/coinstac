const electron = require('electron-prebuilt');
const childProcess = require('child_process');
const promisify = require('bluebird').promisify;

const exec = promisify(childProcess.exec);

module.exports = () => {
  let electronVersion = childProcess.execSync(`${electron} --version`, {
    encoding: 'utf8',
  });
  let electronABI = childProcess.execSync(`${electron} --abi`, {
    encoding: 'utf8',
  });
  electronVersion = electronVersion.match(/v(\d+\.\d+\.\d+)/)[1];
  electronABI = electronABI.match(/(\d+)/)[1];
  exec(`npm rebuild --runtime=electron --target=${electronVersion} --disturl=https://atom.io/download/atom-shell --abi=${electronABI}`)
  .then(res => {
    console.log(`Done building native modules: ${res}`); // eslint-disable-line no-console
  })
  .catch(err => {
    console.log(`There was a problem building: ${err}`); // eslint-disable-line no-console
  });
};
