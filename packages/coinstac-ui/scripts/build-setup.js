const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const mkdirp = pify(require('mkdirp'));
const ncp = pify(require('ncp'));
const path = require('path');
const npmi = require('./utils/npmi');

const paths = [
  path.join('node_modules', 'coinstac-common'),
  path.join('node_modules', 'coinstac-client-core'),
  path.join('node_modules', 'coinstac-graphql-schema'),
  path.join('node_modules', 'coinstac-docker-manager'),
  path.join('node_modules', 'coinstac-pipeline'),
];
rmrf('./node_modules/coinstac-*(common|client-core|graphql-schema|docker-manager|pipeline)')
  .then(() => rmrf('./node_modules/.bin/coinstac-*(common|graphql-schema|docker-manager|pipeline)'))
  .then(() => rmrf('./config/local.json'))
  .then(() => Promise.all(paths.map(p => mkdirp(p))))
  .then(() => Promise.all([
    ncp('../coinstac-common/package.json', './node_modules/coinstac-common/package.json'),
    ncp('../coinstac-common/src', './node_modules/coinstac-common/src'),
    ncp('../coinstac-graphql-schema/package.json', './node_modules/coinstac-graphql-schema/package.json'),
    ncp('../coinstac-graphql-schema/src', './node_modules/coinstac-graphql-schema/src'),
    ncp('../coinstac-client-core/src', './node_modules/coinstac-client-core/src'),
    ncp('../coinstac-client-core/config.js', './node_modules/coinstac-client-core/config.js'),
    ncp('../coinstac-client-core/package.json', './node_modules/coinstac-client-core/package.json'),
    ncp('../coinstac-docker-manager/package.json', './node_modules/coinstac-docker-manager/package.json'),
    ncp('../coinstac-docker-manager/src', './node_modules/coinstac-docker-manager/src'),
    ncp('../coinstac-pipeline/package.json', './node_modules/coinstac-pipeline/package.json'),
    ncp('../coinstac-pipeline/src', './node_modules/coinstac-pipeline/src'),
  ]))
  .then(() => paths.map(p => npmi(p)))
  .catch(console.error); // eslint-disable-line no-console
