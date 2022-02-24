/* eslint-disable no-console */
const fs = require('fs').promises;
const electronBuilder = require('electron-builder');

const { NODE_ENV, DEPLOY } = process.env;

const buildConfig = {};

if (NODE_ENV === 'production' && DEPLOY) {
  console.log('Preparing to deploy...');
  buildConfig.win = ['nsis'];
  buildConfig.mac = ['default'];
  buildConfig.linux = ['AppImage'];
} else {
  buildConfig.dir = true;
  buildConfig.win = ['zip'];
  buildConfig.mac = ['zip'];
  buildConfig.linux = ['zip'];
}

fs.rename('./config/local.json', './config/local-build-copy.json')
  .catch((e) => {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  })
  .then(() => {
    if (NODE_ENV === 'local') {
      console.log('Creating development build');
      return fs.copyFile('./config/local-example.json', './config/local.json');
    }

    if (NODE_ENV === 'development') {
      console.log('Creating development build');
      return fs.copyFile('./config/local-development.json', './config/local.json');
    }

    if (NODE_ENV === 'production') {
      console.log('Creating production build');
      return fs.copyFile('./config/local-production.json', './config/local.json');
    }
  })
  .then(() => electronBuilder.build(Object.assign({}, buildConfig, { publish: DEPLOY ? 'always' : 'never' })))
  .then(() => fs.rename('./config/local-build-copy.json', './config/local.json'))
  .catch((err) => {
    if (err.code !== 'ENOENT') console.error('Build failed with:', err);
  });
