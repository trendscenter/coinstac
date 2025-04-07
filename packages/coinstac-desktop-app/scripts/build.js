/* eslint-disable no-console, import/no-extraneous-dependencies */
const fs = require('fs').promises;
const { build, Platform, Arch } = require('electron-builder');
const config = require('../electron-builder.config');

const { NODE_ENV, DEPLOY } = process.env;

const buildConfig = {};

if (NODE_ENV === 'production' && DEPLOY) {
  console.log('Preparing to deploy...');
  // buildConfig.win = ['nsis'];
  // buildConfig.mac = ['default'];
  // buildConfig.linux = ['AppImage'];
  buildConfig.publish = { provider: 'github' };
} else {
  buildConfig.dir = true;
  buildConfig.win = ['zip'];
  buildConfig.mac = ['zip'];
  buildConfig.linux = ['zip'];
}
const finalConfig = Object.assign(
  { config },
  buildConfig,
  {
    targets: [
//      ...Platform.MAC.createTarget("dmg", Arch.universal),
//      ...Platform.WINDOWS.createTarget('nsis', Arch.x64),
      ...Platform.LINUX.createTarget('AppImage', Arch.x64),
    ],
    publish: DEPLOY ? 'always' : 'never'
  });
console.log(JSON.stringify(finalConfig, null, 2))
// process.exit()
fs.rename('./config/local.json', './config/local-build-copy.json')
  .catch((e) => {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  })
  .then(() => {
    console.log(`Creating ${process.env.LOCAL_CONFIG || NODE_ENV} build`);
    return fs.copyFile(`./config/local-${process.env.LOCAL_CONFIG || NODE_ENV}.json`, './config/local.json');
  })
  .then(() => build(finalConfig))
  .then(() => fs.rename('./config/local-build-copy.json', './config/local.json'))
  .catch((err) => {
    if (err.code !== 'ENOENT') console.error('Build failed with:', err);
  });
