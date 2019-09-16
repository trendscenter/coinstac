const pify = require('util').promisify;
const ncp = pify(require('ncp'));

Promise.all([
  ncp('../coinstac-docker-manager/src', './node_modules/coinstac-docker-manager/src'),
  ncp('../coinstac-pipeline/src', './node_modules/coinstac-pipeline/src'),
  ncp('../coinstac-client-core/src', './node_modules/coinstac-client-core/src'),
])
  .catch(console.error); // eslint-disable-line no-console
