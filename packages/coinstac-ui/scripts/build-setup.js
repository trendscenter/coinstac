const bluebird = require('bluebird');
const rmrf = bluebird.promisify(require('rimraf'));
const mkdirp = bluebird.promisify(require('mkdirp'));
const ncp = bluebird.promisify(require('ncp'));
const path = require('path');

rmrf('./node_modules/coinstac-*(common|client-core)')
.then(() => {
    return mkdirp(path.join('node_modules', 'coinstac-common'));
})
.then(() => {
    return mkdirp(path.join('node_modules', 'coinstac-client-core'));
})
.then(() => {
    return ncp('../coinstac-common/package.json', './node_modules/coinstac-common/package.json');
})
.then(() => {
    return ncp('../coinstac-common/src', './node_modules/coinstac-common/src');
})
.then(() => {
    return ncp('../coinstac-client-core/src', './node_modules/coinstac-client-core/src');
})
.then(() => {
    return ncp('../coinstac-client-core/bin', './node_modules/coinstac-client-core/bin');
})
.then(() => {
    return ncp('../coinstac-client-core/config.js', './node_modules/coinstac-client-core/config.js');
})
.then(() => {
    return ncp('../coinstac-client-core/package.json', './node_modules/coinstac-client-core/package.json');
});

