'use strict';

const pkg = require('./package.json');
const pkgName = pkg.name;

module.exports = {
  local: {
    fn: () => pkgName,
    type: 'function',
  },
  name: pkgName,
  remote: {
    fn: () => pkgName,
    type: 'function',
  },
  repository: {
    url: `https://github.com/MRN-Code/${pkgName}`,
  },
  version: pkg.version,
};
