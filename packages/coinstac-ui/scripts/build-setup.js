const bluebird = require('bluebird');
const rmrf = bluebird.promisify(require('rimraf'));
const mkdirp = bluebird.promisify(require('mkdirp'));
const ncp = bluebird.promisify(require('ncp'));
const path = require('path');

rmrf('./node_modules/coinstac-*(common|client-core|computation-registry)')
.then(() => rmrf('./node_modules/.bin/coinstac-*(common|client-core|computation-registry)'))
.then(() => Promise.all([
  mkdirp(path.join('node_modules', 'coinstac-common')),
  mkdirp(path.join('node_modules', 'coinstac-client-core')),
  mkdirp(path.join('node_modules', 'coinstac-computation-registry')),
]))
.then(() => Promise.all([
  ncp('../coinstac-common/package.json', './node_modules/coinstac-common/package.json'),
  ncp('../coinstac-common/src', './node_modules/coinstac-common/src'),
  ncp('../coinstac-client-core/src', './node_modules/coinstac-client-core/src'),
  ncp('../coinstac-client-core/config.js', './node_modules/coinstac-client-core/config.js'),
  ncp('../coinstac-client-core/package.json', './node_modules/coinstac-client-core/package.json'),
  ncp(
    '../coinstac-computation-registry/package.json',
    './node_modules/coinstac-computation-registry/package.json'
  ),
  ncp(
    '../coinstac-computation-registry/src',
    './node_modules/coinstac-computation-registry/src'
  ),
]))
.catch(console.error); // eslint-disable-line no-console
