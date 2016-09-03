const path = require('path');

module.exports = {
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/process-dir/index.js'
  ),
  local: [{
    dirs: ['jills-data'],
  }, {
    dirs: ['chris-data'],
  }],
  verbose: true,
};
