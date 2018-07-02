const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const mkdirp = pify(require('mkdirp'));
const ncp = pify(require('ncp'));
const path = require('path');

rmrf('./node_modules/coinstac-*(common|client-core|graphql-schema)')
.then(() => rmrf('./node_modules/.bin/coinstac-*(common|client-core|graphql-schema)'))
.then(() => rmrf('./config/local.json'))
.then(() => Promise.all([
  mkdirp(path.join('node_modules', 'coinstac-common')),
  mkdirp(path.join('node_modules', 'coinstac-client-core')),
  mkdirp(path.join('node_modules', 'coinstac-graphql-schema')),
]))
.then(() => Promise.all([
  ncp('../coinstac-common/package.json', './node_modules/coinstac-common/package.json'),
  ncp('../coinstac-common/src', './node_modules/coinstac-common/src'),
  ncp('../coinstac-common/package.json', './node_modules/coinstac-graphql-schema/package.json'),
  ncp('../coinstac-common/src', './node_modules/coinstac-graphql-schema/src'),
  ncp('../coinstac-client-core/src', './node_modules/coinstac-client-core/src'),
  ncp('../coinstac-client-core/config.js', './node_modules/coinstac-client-core/config.js'),
  ncp('../coinstac-client-core/package.json', './node_modules/coinstac-client-core/package.json'),
]))
.catch(console.error); // eslint-disable-line no-console
